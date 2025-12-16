/**
 * Type definitions for Gesture Code extension
 * Comprehensive types for hand tracking and gesture recognition
 */

// ============================================================================
// Hand Tracking Types
// ============================================================================

/**
 * A single hand landmark point from MediaPipe
 * Coordinates are normalized to 0-1 range relative to image dimensions
 */
export interface HandLandmark {
    /** X coordinate (0-1, normalized to image width) */
    x: number;
    /** Y coordinate (0-1, normalized to image height) */
    y: number;
    /** Z coordinate (depth, smaller values = closer to camera) */
    z: number;
    /** Visibility score (0-1, optional) */
    visibility?: number;
}

/**
 * Represents a detected hand with all landmarks
 */
export interface Hand {
    /** Array of 21 hand landmark points */
    landmarks: HandLandmark[];
    /** Which hand (left or right) */
    handedness: 'Left' | 'Right';
    /** Detection confidence score (0-1) */
    score: number;
}

/**
 * Raw results from MediaPipe hand detection
 */
export interface HandResults {
    /** Array of landmark arrays, one per detected hand */
    multiHandLandmarks: HandLandmark[][];
    /** Handedness information for each detected hand */
    multiHandedness: HandednessInfo[];
    /** Source image/video element */
    image: unknown;
}

/**
 * Handedness classification from MediaPipe
 */
export interface HandednessInfo {
    /** Index of the hand in results array */
    index: number;
    /** Classification confidence score */
    score: number;
    /** Left or Right hand label */
    label: 'Left' | 'Right';
}

// ============================================================================
// Gesture Types
// ============================================================================

/**
 * All supported gesture types
 */
export type GestureType =
    | 'open_palm'
    | 'closed_fist'
    | 'point_up'
    | 'point_down'
    | 'point_left'
    | 'point_right'
    | 'peace_sign'
    | 'pinch'
    | 'thumbs_up'
    | 'thumbs_down'
    | 'swipe_left'
    | 'swipe_right'
    | 'none';

/**
 * Enum version of gesture types for use in mappings
 */
export enum GestureTypeEnum {
    OpenPalm = 'open_palm',
    ClosedFist = 'closed_fist',
    PointUp = 'point_up',
    PointDown = 'point_down',
    PointLeft = 'point_left',
    PointRight = 'point_right',
    PeaceSign = 'peace_sign',
    Pinch = 'pinch',
    ThumbsUp = 'thumbs_up',
    ThumbsDown = 'thumbs_down',
    SwipeLeft = 'swipe_left',
    SwipeRight = 'swipe_right',
    None = 'none'
}

/**
 * Result of gesture detection
 */
export interface GestureResult {
    /** Detected gesture type */
    gesture: GestureType;
    /** Detection confidence (0-1) */
    confidence: number;
    /** Which hand performed the gesture */
    hand: 'Left' | 'Right';
    /** Hand landmarks used for detection */
    landmarks: HandLandmark[];
}

// ============================================================================
// Gesture Action & Mapping Types
// ============================================================================

/**
 * Defines an action to perform when a gesture is detected
 */
export interface GestureAction {
    /** The gesture that triggers this action */
    gesture: GestureType;
    /** VS Code command ID to execute */
    command: string;
    /** Optional arguments to pass to the command */
    args?: unknown[];
    /** Human-readable label for the action */
    label: string;
    /** Description of what the action does */
    description: string;
    /** Optional icon identifier (codicon name) */
    icon?: string;
}

/**
 * Maps gestures to their corresponding actions
 */
export type GestureMapping = {
    [K in GestureType]?: GestureAction;
};

/**
 * Partial gesture mapping for custom user configurations
 */
export type CustomGestureMapping = Partial<GestureMapping>;

// ============================================================================
// State Types
// ============================================================================

/**
 * Current state of the hand tracking system
 */
export interface TrackingState {
    /** Whether tracking is currently active */
    isTracking: boolean;
    /** Whether the webcam is active and streaming */
    isWebcamActive: boolean;
    /** Currently detected gesture, if any */
    currentGesture: GestureType | null;
    /** Timestamp of the last detected gesture */
    lastGestureTime: number;
    /** Current frames per second */
    fps: number;
    /** Error message, if any */
    error: string | null;
}

/**
 * Initial/default tracking state
 */
export const DEFAULT_TRACKING_STATE: TrackingState = {
    isTracking: false,
    isWebcamActive: false,
    currentGesture: null,
    lastGestureTime: 0,
    fps: 0,
    error: null
};

// ============================================================================
// Message Types (Extension <-> Webview Communication)
// ============================================================================

/**
 * Message types sent from webview to extension
 */
export type WebviewMessageType =
    | 'gesture'
    | 'status'
    | 'error'
    | 'config'
    | 'command'
    | 'ready';

/**
 * Messages sent from webview to extension
 */
export interface WebviewMessage<T = unknown> {
    /** Type of message */
    type: WebviewMessageType;
    /** Message payload */
    payload: T;
}

/**
 * Gesture detected message payload
 */
export interface GesturePayload {
    gesture: GestureType;
    confidence: number;
    hand: 'Left' | 'Right';
    timestamp: number;
}

/**
 * Status update message payload
 */
export interface StatusPayload {
    isTracking: boolean;
    isWebcamActive: boolean;
    fps?: number;
}

/**
 * Error message payload
 */
export interface ErrorPayload {
    message: string;
    code?: string;
}

/**
 * Message types sent from extension to webview
 */
export type ExtensionMessageType =
    | 'start'
    | 'stop'
    | 'updateConfig'
    | 'ping';

/**
 * Messages sent from extension to webview
 */
export interface ExtensionMessage<T = unknown> {
    /** Type of message */
    type: ExtensionMessageType;
    /** Optional message payload */
    payload?: T;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Full gesture code configuration
 */
export interface GestureConfig {
    /** Whether gesture tracking is enabled */
    enabled: boolean;
    /** Detection sensitivity (0.1-1.0, lower = more sensitive) */
    sensitivity: number;
    /** Whether to show the hand tracking overlay */
    showOverlay: boolean;
    /** Cooldown between gestures in milliseconds */
    gestureCooldown: number;
    /** Custom gesture-to-command mappings */
    customMappings: CustomGestureMapping;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: GestureConfig = {
    enabled: false,
    sensitivity: 0.7,
    showOverlay: true,
    gestureCooldown: 500,
    customMappings: {}
};

// ============================================================================
// MediaPipe Landmark Indices (for reference)
// ============================================================================

/**
 * MediaPipe hand landmark indices
 * @see https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
 */
export const HAND_LANDMARKS = {
    WRIST: 0,
    THUMB_CMC: 1,
    THUMB_MCP: 2,
    THUMB_IP: 3,
    THUMB_TIP: 4,
    INDEX_MCP: 5,
    INDEX_PIP: 6,
    INDEX_DIP: 7,
    INDEX_TIP: 8,
    MIDDLE_MCP: 9,
    MIDDLE_PIP: 10,
    MIDDLE_DIP: 11,
    MIDDLE_TIP: 12,
    RING_MCP: 13,
    RING_PIP: 14,
    RING_DIP: 15,
    RING_TIP: 16,
    PINKY_MCP: 17,
    PINKY_PIP: 18,
    PINKY_DIP: 19,
    PINKY_TIP: 20
} as const;

/**
 * Finger tip landmark indices
 */
export const FINGER_TIPS = [
    HAND_LANDMARKS.THUMB_TIP,
    HAND_LANDMARKS.INDEX_TIP,
    HAND_LANDMARKS.MIDDLE_TIP,
    HAND_LANDMARKS.RING_TIP,
    HAND_LANDMARKS.PINKY_TIP
] as const;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * VS Code command with arguments
 */
export interface VSCodeCommand {
    command: string;
    title: string;
    arguments?: unknown[];
}

/**
 * Disposable resource interface
 */
export interface Disposable {
    dispose(): void;
}

/**
 * Event emitter type
 */
export type EventCallback<T> = (data: T) => void;

// ============================================================================
// Legacy Types (for backward compatibility)
// ============================================================================

/** @deprecated Use HandLandmark instead */
export type NormalizedLandmark = HandLandmark;

/** @deprecated Use HandLandmark[] instead */
export type NormalizedLandmarkList = HandLandmark[];

/** @deprecated Use HandednessInfo instead */
export type Handedness = HandednessInfo;
