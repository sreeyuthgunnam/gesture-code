/**
 * Gesture Code Extension - Main Entry Point
 * 
 * Control VS Code with hand gestures using your webcam.
 * Uses MediaPipe for real-time hand tracking and gesture recognition.
 */

import * as vscode from 'vscode';
import { GestureCodeManager } from './managers/GestureCodeManager';
import {
    toggleTrackingCommand,
    openPanelCommand,
    configureGesturesCommand,
    showGesturesCommand
} from './commands';

let manager: GestureCodeManager;

/**
 * Extension activation
 * Called when the extension is first activated
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('Gesture Code extension is activating...');

    // Initialize manager
    manager = GestureCodeManager.getInstance();
    manager.initialize(context);

    // Register commands
    const commands = [
        vscode.commands.registerCommand(
            'gesture-code.toggle',
            () => toggleTrackingCommand(manager)
        ),
        vscode.commands.registerCommand(
            'gesture-code.openPanel',
            () => openPanelCommand(manager)
        ),
        vscode.commands.registerCommand(
            'gesture-code.configure',
            () => configureGesturesCommand(manager)
        ),
        vscode.commands.registerCommand(
            'gesture-code.showGestures',
            () => showGesturesCommand(manager)
        )
    ];

    // Add commands to subscriptions
    commands.forEach(cmd => context.subscriptions.push(cmd));

    // Show welcome message on first install
    const hasShownWelcome = context.globalState.get<boolean>('gestureCode.welcomeShown');
    if (!hasShownWelcome) {
        showWelcomeMessage();
        context.globalState.update('gestureCode.welcomeShown', true);
    }

    console.log('Gesture Code extension activated successfully!');
}

/**
 * Extension deactivation
 * Called when the extension is deactivated
 */
export function deactivate(): void {
    console.log('Gesture Code extension is deactivating...');

    if (manager) {
        manager.dispose();
    }

    console.log('Gesture Code extension deactivated');
}

/**
 * Show welcome message on first install
 */
async function showWelcomeMessage(): Promise<void> {
    const selection = await vscode.window.showInformationMessage(
        ' Welcome to Gesture Code! Control VS Code with hand gestures.',
        'Get Started',
        'View Gestures',
        'Later'
    );

    if (selection === 'Get Started') {
        vscode.commands.executeCommand('gesture-code.openPanel');
    } else if (selection === 'View Gestures') {
        vscode.commands.executeCommand('gesture-code.showGestures');
    }
}
