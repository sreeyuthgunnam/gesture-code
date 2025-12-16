/**
 * Gesture Mappings - Default gesture-to-command mappings
 * 
 * Maps hand gestures to VS Code commands for the Gesture Code extension.
 * Includes helper functions for retrieving and formatting gesture information.
 */

import {
    GestureType,
    GestureAction,
    GestureMapping,
    CustomGestureMapping
} from '../types';

// ============================================================================
// Default Gesture Mappings
// ============================================================================

/**
 * Default gesture-to-command mappings
 * Each gesture maps to a VS Code command with metadata for UI display
 */
export const DEFAULT_GESTURE_MAPPINGS: GestureMapping = {
    // Navigation
    open_palm: {
        gesture: 'open_palm',
        command: 'editorScroll',
        args: [{ to: 'up', by: 'halfPage' }],
        label: 'Scroll Up',
        description: 'Scroll the editor up by half page',
        icon: '✋'
    },

    closed_fist: {
        gesture: 'closed_fist',
        command: 'editorScroll',
        args: [{ to: 'down', by: 'halfPage' }],
        label: 'Scroll Down',
        description: 'Scroll the editor down by half page',
        icon: '👊'
    },

    point_up: {
        gesture: 'point_up',
        command: 'cursorUp',
        label: 'Cursor Up',
        description: 'Move cursor up one line',
        icon: '👆'
    },

    point_down: {
        gesture: 'point_down',
        command: 'cursorDown',
        label: 'Cursor Down',
        description: 'Move cursor down one line',
        icon: '👇'
    },

    // Editing
    point_left: {
        gesture: 'point_left',
        command: 'undo',
        label: 'Undo',
        description: 'Undo last action',
        icon: '👈'
    },

    point_right: {
        gesture: 'point_right',
        command: 'redo',
        label: 'Redo',
        description: 'Redo last undone action',
        icon: '👉'
    },

    peace_sign: {
        gesture: 'peace_sign',
        command: 'editor.action.commentLine',
        label: 'Toggle Comment',
        description: 'Toggle line comment',
        icon: '✌️'
    },

    // Actions
    thumbs_up: {
        gesture: 'thumbs_up',
        command: 'workbench.action.files.save',
        label: 'Save File',
        description: 'Save the current file',
        icon: '👍'
    },

    thumbs_down: {
        gesture: 'thumbs_down',
        command: 'workbench.action.closeActiveEditor',
        label: 'Close Tab',
        description: 'Close the current editor tab',
        icon: '👎'
    },

    // View
    pinch: {
        gesture: 'pinch',
        command: 'editor.action.fontZoomIn',
        label: 'Zoom In',
        description: 'Increase editor font size',
        icon: '🤏'
    },

    swipe_left: {
        gesture: 'swipe_left',
        command: 'workbench.action.previousEditor',
        label: 'Previous Tab',
        description: 'Switch to previous editor tab',
        icon: '⬅️'
    },

    swipe_right: {
        gesture: 'swipe_right',
        command: 'workbench.action.nextEditor',
        label: 'Next Tab',
        description: 'Switch to next editor tab',
        icon: '➡️'
    },

    // No action for 'none' gesture
    none: undefined
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the gesture mapping for a specific gesture
 * Returns custom mapping if exists, otherwise default
 * 
 * @param gesture - The gesture type to look up
 * @param customMappings - Optional custom mappings to override defaults
 * @returns The gesture action or undefined if not mapped
 */
export function getGestureMapping(
    gesture: GestureType,
    customMappings?: CustomGestureMapping
): GestureAction | undefined {
    // Check custom mappings first
    if (customMappings && customMappings[gesture]) {
        return customMappings[gesture];
    }

    // Fall back to default mappings
    return DEFAULT_GESTURE_MAPPINGS[gesture];
}

/**
 * Get all gesture mappings, merging custom with defaults
 * Custom mappings override defaults where specified
 * 
 * @param customMappings - Optional custom mappings to merge
 * @returns Complete gesture mapping object
 */
export function getAllGestureMappings(
    customMappings?: CustomGestureMapping
): GestureMapping {
    if (!customMappings) {
        return { ...DEFAULT_GESTURE_MAPPINGS };
    }

    // Merge custom mappings over defaults
    return {
        ...DEFAULT_GESTURE_MAPPINGS,
        ...customMappings
    };
}

/**
 * Get the human-readable label for a gesture
 * 
 * @param gesture - The gesture type
 * @returns Human-readable label string
 */
export function getGestureLabel(gesture: GestureType): string {
    const mapping = DEFAULT_GESTURE_MAPPINGS[gesture];
    if (mapping?.label) {
        return mapping.label;
    }

    // Format gesture name as fallback
    return formatGestureName(gesture);
}

/**
 * Get the emoji icon for a gesture
 * 
 * @param gesture - The gesture type
 * @returns Emoji icon string
 */
export function getGestureIcon(gesture: GestureType): string {
    const mapping = DEFAULT_GESTURE_MAPPINGS[gesture];
    return mapping?.icon ?? '🤚';
}

/**
 * Format gesture information for UI display
 * 
 * @param gesture - The gesture type
 * @param customMappings - Optional custom mappings
 * @returns Formatted display object with icon, label, and command
 */
export function formatGestureForDisplay(
    gesture: GestureType,
    customMappings?: CustomGestureMapping
): { icon: string; label: string; command: string; description: string } {
    const mapping = getGestureMapping(gesture, customMappings);

    if (!mapping) {
        return {
            icon: '❓',
            label: formatGestureName(gesture),
            command: 'none',
            description: 'No action mapped'
        };
    }

    return {
        icon: mapping.icon ?? '🤚',
        label: mapping.label,
        command: mapping.command,
        description: mapping.description
    };
}

/**
 * Format gesture type string to human-readable name
 * 
 * @param gesture - The gesture type string
 * @returns Formatted name with capitalized words
 */
export function formatGestureName(gesture: string): string {
    return gesture
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Get all available gestures (excluding 'none')
 * 
 * @returns Array of gesture types that have mappings
 */
export function getAvailableGestures(): GestureType[] {
    return Object.keys(DEFAULT_GESTURE_MAPPINGS)
        .filter((gesture): gesture is GestureType =>
            gesture !== 'none' && DEFAULT_GESTURE_MAPPINGS[gesture as GestureType] !== undefined
        );
}

/**
 * Get gesture action by gesture type (legacy support)
 * 
 * @param gesture - The gesture type or enum value
 * @returns The gesture action or null if not found
 * @deprecated Use getGestureMapping instead
 */
export function getGestureAction(gesture: GestureType | string): GestureAction | null {
    // Handle string enum values from gestures.ts
    const gestureKey = gesture as GestureType;
    return DEFAULT_GESTURE_MAPPINGS[gestureKey] ?? null;
}

/**
 * Execute a gesture action (legacy support)
 * 
 * @param gesture - The gesture type
 * @param vscodeModule - VS Code module reference
 * @returns Promise resolving to true if action was executed
 * @deprecated Use executeVSCodeCommand in commands/index.ts instead
 */
export async function executeGestureAction(
    gesture: GestureType | string,
    vscodeModule: typeof import('vscode')
): Promise<boolean> {
    const action = getGestureAction(gesture);

    if (!action) {
        return false;
    }

    try {
        await vscodeModule.commands.executeCommand(
            action.command,
            ...(action.args ?? [])
        );
        return true;
    } catch (error) {
        console.error(`Failed to execute gesture action: ${action.command}`, error);
        return false;
    }
}
