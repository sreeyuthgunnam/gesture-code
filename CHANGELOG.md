# Changelog

All notable changes to the "Gesture Code" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-12-16

### Changed
- **Architecture Redesign**: Moved hand tracking to external browser for better MediaPipe/WebAssembly compatibility
- Local HTTP server now serves the tracking page
- Improved gesture detection algorithm with handedness awareness
- Better stabilization to prevent false positives

### Added
- Gesture stabilization using frame history (requires 3+ frames in 500ms)
- Debug information display showing finger states
- Proper left/right hand detection with mirrored video handling

### Fixed
- WebAssembly CSP (Content Security Policy) issues in VS Code webview
- Thumb detection now correctly accounts for hand orientation
- Improved accuracy for all 6 supported gestures

## [0.1.1] - 2024-12-15

### Fixed
- Initial bug fixes and stability improvements

## [0.1.0] - 2024-12-15

### Added
- Initial release
- Real-time hand tracking using MediaPipe
- 6 gesture recognition support:
  - Open Palm (Scroll Up)
  - Closed Fist (Scroll Down)  
  - Point Up (Cursor Up)
  - Peace Sign (Toggle Comment)
  - Thumbs Up (Save File)
  - Thumbs Down (Close Tab)
- Hand tracking overlay visualization
- Adjustable sensitivity and cooldown settings
- Status bar integration
- Keyboard shortcut (Ctrl+Shift+G / Cmd+Shift+G)

### Security
- All video processing done locally using MediaPipe
- No data sent to external servers
- Camera feed stays entirely on user's machine

## [Unreleased]

### Planned
- More gesture types (swipe, pinch)
- Custom gesture-to-command mapping UI
- Gesture recording/training for custom gestures
- Performance optimizations
