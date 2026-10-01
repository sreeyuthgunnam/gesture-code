/**
 * GestureCodeManager - Central manager for the Gesture Code extension
 * 
 * Singleton class that orchestrates the extension's core functionality:
 * - Configuration management and persistence
 * - Tracking server lifecycle management  
 * - Gesture-to-command execution
 * - Status bar UI updates
 */

import * as vscode from 'vscode';
import { TrackingServer } from '../server/trackingServer';
import { getGestureMapping, normalizeGestureType } from '../gestures/mappings';
import { GestureConfig, GestureMapping } from '../types';

/**
 * GestureCodeManager singleton class
 * Manages the entire Gesture Code extension state and functionality
 */
export class GestureCodeManager {
    private static instance: GestureCodeManager;

    private context: vscode.ExtensionContext | null = null;
    private trackingServer: TrackingServer | null = null;
    private statusBarItem: vscode.StatusBarItem | null = null;
    private config: GestureConfig;
    private isTracking: boolean = false;
    private disposables: vscode.Disposable[] = [];

    /**
     * Private constructor for singleton pattern
     */
    private constructor() {
        this.config = this.getDefaultConfig();
    }

    /**
     * Get the singleton instance of GestureCodeManager
     */
    public static getInstance(): GestureCodeManager {
        if (!GestureCodeManager.instance) {
            GestureCodeManager.instance = new GestureCodeManager();
        }
        return GestureCodeManager.instance;
    }

    // ========================================================================
    // Initialization
    // ========================================================================

    /**
     * Initialize the manager with extension context
     */
    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        this.loadConfig();
        this.createStatusBarItem();
        this.registerConfigurationListener();

        console.log('GestureCodeManager initialized');
    }

    /**
     * Get default configuration values
     */
    private getDefaultConfig(): GestureConfig {
        return {
            enabled: false,
            sensitivity: 0.7,
            showOverlay: true,
            gestureCooldown: 500,
            customMappings: {}
        };
    }

    // ========================================================================
    // Configuration Management
    // ========================================================================

    /**
     * Load configuration from VS Code settings
     */
    public loadConfig(): void {
        const wsConfig = vscode.workspace.getConfiguration('gestureCode');

        this.config = {
            enabled: wsConfig.get<boolean>('enabled', false),
            sensitivity: wsConfig.get<number>('sensitivity', 0.7),
            showOverlay: wsConfig.get<boolean>('showOverlay', true),
            gestureCooldown: wsConfig.get<number>('gestureCooldown', 500),
            customMappings: wsConfig.get<Partial<GestureMapping>>('customMappings', {})
        };
    }

    /**
     * Get current configuration
     */
    public getConfig(): GestureConfig {
        return { ...this.config };
    }

    /**
     * Update configuration with new values
     */
    public async updateConfig(newConfig: Partial<GestureConfig>): Promise<void> {
        this.config = { ...this.config, ...newConfig };

        const wsConfig = vscode.workspace.getConfiguration('gestureCode');
        for (const [key, value] of Object.entries(newConfig)) {
            await wsConfig.update(key, value, vscode.ConfigurationTarget.Global);
        }
    }

    /**
     * Register listener for configuration changes
     */
    private registerConfigurationListener(): void {
        const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('gestureCode')) {
                this.loadConfig();
                this.updateStatusBar();
            }
        });

        this.disposables.push(disposable);
    }

    // ========================================================================
    // Status Bar
    // ========================================================================

    /**
     * Create the status bar item
     */
    private createStatusBarItem(): void {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );

        this.statusBarItem.command = 'gesture-code.toggle';
        this.updateStatusBar();
        this.statusBarItem.show();

        if (this.context) {
            this.context.subscriptions.push(this.statusBarItem);
        }
    }

    /**
     * Update status bar display based on tracking state
     */
    public updateStatusBar(): void {
        if (!this.statusBarItem) return;

        if (this.isTracking) {
            this.statusBarItem.text = '$(hand) Gestures: ON';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = 'Click to disable gesture tracking (Ctrl+Shift+G)';
        } else {
            this.statusBarItem.text = '$(hand) Gestures: OFF';
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.tooltip = 'Click to enable gesture tracking (Ctrl+Shift+G)';
        }
    }

    // ========================================================================
    // Panel Management (External Browser Approach)
    // ========================================================================

    /**
     * Open the gesture tracking panel in external browser
     * 
     * Due to VS Code webview CSP restrictions with MediaPipe's WebAssembly,
     * we serve a tracking page via local HTTP server that the user opens
     * in their default browser for full camera/ML functionality.
     */
    public async openPanel(): Promise<void> {
        if (!this.context) {
            vscode.window.showErrorMessage('Gesture Code not properly initialized');
            return;
        }

        try {
            // Create tracking server if not exists
            if (!this.trackingServer) {
                this.trackingServer = new TrackingServer(this.config);

                // Set up gesture callback to execute VS Code commands
                this.trackingServer.onGesture((gesture: string) => {
                    this.executeGestureCommand(gesture);
                });
            }

            // Start the server
            await this.trackingServer.start();
            const url = this.trackingServer.getUrl();

            // Mark as tracking and update UI
            this.isTracking = true;
            this.updateStatusBar();

            // Prompt user to open in browser
            const action = await vscode.window.showInformationMessage(
                `🖐️ Gesture Code server running!\n\nOpen this URL in your browser:\n${url}`,
                'Copy URL',
                'Open Browser'
            );

            if (action === 'Open Browser') {
                // Open URL in default browser
                vscode.env.openExternal(vscode.Uri.parse(url));
            }

            if (action === 'Copy URL') {
                await vscode.env.clipboard.writeText(url);
                vscode.window.showInformationMessage('URL copied! Paste in your browser address bar.');
            }
        } catch (error) {
            console.error('Failed to start tracking server:', error);
            vscode.window.showErrorMessage('Failed to open Gesture Code: ' + (error as Error).message);
        }
    }

    /**
     * Execute VS Code command based on detected gesture
     */
    private async executeGestureCommand(gesture: string): Promise<void> {
        console.log('Received gesture from browser:', gesture);
        const gestureType = normalizeGestureType(gesture);
        const mapping = gestureType
            ? getGestureMapping(gestureType, this.config.customMappings)
            : undefined;

        if (!mapping) {
            return;
        }

        try {
            await vscode.commands.executeCommand(mapping.command, ...(mapping.args ?? []));
            vscode.window.setStatusBarMessage(`${mapping.icon ?? '$(hand)'} ${mapping.label}`, 1500);
        } catch (error) {
            console.error('Failed to execute gesture command:', error);
            vscode.window.showErrorMessage(`Failed to execute ${mapping.label}: ${(error as Error).message}`);
        }
    }

    // ========================================================================
    // Tracking Control
    // ========================================================================

    /**
     * Start gesture tracking
     */
    public async startTracking(): Promise<void> {
        if (this.isTracking) return;
        this.openPanel();
    }

    /**
     * Stop gesture tracking
     */
    public stopTracking(): void {
        if (!this.isTracking) return;

        if (this.trackingServer) {
            this.trackingServer.stop();
            this.trackingServer = null;
        }

        this.isTracking = false;
        this.config.enabled = false;
        this.updateStatusBar();

        vscode.window.showInformationMessage('🖐️ Gesture tracking disabled');
    }

    /**
     * Toggle gesture tracking on/off
     */
    public toggleTracking(): void {
        if (this.isTracking) {
            this.stopTracking();
        } else {
            this.startTracking();
        }
    }

    /**
     * Check if currently tracking
     */
    public isCurrentlyTracking(): boolean {
        return this.isTracking;
    }

    // ========================================================================
    // Cleanup
    // ========================================================================

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        if (this.isTracking) {
            this.stopTracking();
        }

        if (this.trackingServer) {
            this.trackingServer.stop();
            this.trackingServer = null;
        }

        this.disposables.forEach(d => d.dispose());
        this.disposables = [];

        console.log('GestureCodeManager disposed');
    }
}

/**
 * Helper function to get the manager instance
 */
export function getGestureCodeManager(context?: vscode.ExtensionContext): GestureCodeManager {
    const manager = GestureCodeManager.getInstance();
    if (context) {
        manager.initialize(context);
    }
    return manager;
}
