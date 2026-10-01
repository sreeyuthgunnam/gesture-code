/**
 * Command Handlers - VS Code command implementations
 * 
 * Provides command handler functions for all registered Gesture Code commands.
 */

import * as vscode from 'vscode';
import { GestureCodeManager } from '../managers/GestureCodeManager';
import { DEFAULT_GESTURE_MAPPINGS } from '../gestures/mappings';
import { GestureType } from '../types';

/**
 * Toggle tracking command handler
 */
export async function toggleTrackingCommand(manager: GestureCodeManager): Promise<void> {
    try {
        manager.toggleTracking();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to toggle tracking: ${(error as Error).message}`);
    }
}

/**
 * Open panel command handler
 */
export async function openPanelCommand(manager: GestureCodeManager): Promise<void> {
    try {
        await manager.openPanel();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open panel: ${(error as Error).message}`);
    }
}

/**
 * Configure gestures command handler
 */
export async function configureGesturesCommand(manager: GestureCodeManager): Promise<void> {
    const options = [
        {
            label: '$(edit) Edit Gesture Mappings',
            description: 'Customize gesture to command mappings',
            action: 'mappings'
        },
        {
            label: '$(settings) Adjust Sensitivity',
            description: 'Change gesture detection sensitivity',
            action: 'sensitivity'
        },
        {
            label: '$(eye) Toggle Hand Overlay',
            description: 'Show/hide hand tracking visualization',
            action: 'overlay'
        },
        {
            label: '$(clock) Adjust Cooldown',
            description: 'Change delay between gesture recognitions',
            action: 'cooldown'
        },
        {
            label: '$(refresh) Reset to Defaults',
            description: 'Reset all settings to defaults',
            action: 'reset'
        }
    ];

    const selected = await vscode.window.showQuickPick(options, {
        placeHolder: 'Configure Gesture Code settings'
    });

    if (!selected) {
        return;
    }

    switch (selected.action) {
        case 'mappings':
            // Open settings JSON focused on gesture mappings
            await vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'gestureCode.customMappings'
            );
            break;

        case 'sensitivity': {
            const currentSensitivity = manager.getConfig().sensitivity;
            const sensitivityInput = await vscode.window.showInputBox({
                prompt: 'Enter sensitivity (0.1 - 1.0)',
                value: currentSensitivity.toString(),
                validateInput: (value) => {
                    const num = parseFloat(value);
                    if (isNaN(num) || num < 0.1 || num > 1.0) {
                        return 'Please enter a number between 0.1 and 1.0';
                    }
                    return null;
                }
            });

            if (sensitivityInput) {
                await manager.updateConfig({ sensitivity: parseFloat(sensitivityInput) });
                vscode.window.showInformationMessage(`Sensitivity set to ${sensitivityInput}`);
            }
            break;
        }

        case 'overlay': {
            const currentOverlay = manager.getConfig().showOverlay;
            await manager.updateConfig({ showOverlay: !currentOverlay });
            vscode.window.showInformationMessage(
                `Hand overlay ${!currentOverlay ? 'enabled' : 'disabled'}`
            );
            break;
        }

        case 'cooldown': {
            const currentCooldown = manager.getConfig().gestureCooldown;
            const cooldownInput = await vscode.window.showInputBox({
                prompt: 'Enter cooldown in milliseconds (100 - 2000)',
                value: currentCooldown.toString(),
                validateInput: (value) => {
                    const num = parseInt(value);
                    if (isNaN(num) || num < 100 || num > 2000) {
                        return 'Please enter a number between 100 and 2000';
                    }
                    return null;
                }
            });

            if (cooldownInput) {
                await manager.updateConfig({ gestureCooldown: parseInt(cooldownInput) });
                vscode.window.showInformationMessage(`Cooldown set to ${cooldownInput}ms`);
            }
            break;
        }

        case 'reset': {
            const confirm = await vscode.window.showWarningMessage(
                'Reset all Gesture Code settings to defaults?',
                'Yes',
                'No'
            );

            if (confirm === 'Yes') {
                await manager.updateConfig({
                    sensitivity: 0.7,
                    showOverlay: true,
                    gestureCooldown: 500,
                    customMappings: {}
                });
                vscode.window.showInformationMessage('Settings reset to defaults');
            }
            break;
        }
    }
}

/**
 * Show gestures command handler
 */
export async function showGesturesCommand(_manager: GestureCodeManager): Promise<void> {
    const gestures = Object.entries(DEFAULT_GESTURE_MAPPINGS).map(([gesture, action]) => ({
        label: `${action.icon} ${action.label}`,
        description: action.command,
        detail: action.description,
        gesture: gesture as GestureType
    }));

    const selected = await vscode.window.showQuickPick(gestures, {
        placeHolder: 'Available gestures and their actions',
        matchOnDescription: true,
        matchOnDetail: true
    });

    if (selected) {
        const testGesture = await vscode.window.showInformationMessage(
            `${selected.label}\n${selected.detail}`,
            'Test Gesture',
            'Close'
        );

        if (testGesture === 'Test Gesture') {
            // Simulate the gesture action
            const action = DEFAULT_GESTURE_MAPPINGS[selected.gesture];
            if (action) {
                try {
                    if (action.args) {
                        await vscode.commands.executeCommand(action.command, ...action.args);
                    } else {
                        await vscode.commands.executeCommand(action.command);
                    }
                    vscode.window.showInformationMessage(`✅ Executed: ${action.label}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to execute: ${(error as Error).message}`);
                }
            }
        }
    }
}
