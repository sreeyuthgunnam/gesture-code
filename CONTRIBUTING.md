# Contributing to Gesture Code

First off, thank you for considering contributing to Gesture Code! It's people like you that make open source projects great.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct: be respectful, inclusive, and constructive.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots/GIFs** if applicable
- **Environment info**: OS, VS Code version, browser

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a **clear title** describing the suggestion
- Provide a **detailed description** of the proposed functionality
- Explain **why** this enhancement would be useful
- Include **mockups or examples** if applicable

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feature/your-feature`
3. **Make your changes** following our coding standards
4. **Test** your changes thoroughly
5. **Commit** with clear messages: `git commit -m 'Add: brief description'`
6. **Push** to your fork: `git push origin feature/your-feature`
7. Open a **Pull Request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/gesture-code.git
cd gesture-code

# Install dependencies
npm install

# Compile
npm run compile

# Launch Extension Development Host (F5 in VS Code)
```

## Project Structure

```
src/
├── extension.ts        # Entry point
├── commands/           # VS Code command handlers
├── gestures/           # Gesture definitions & mappings
├── managers/           # Core business logic (singleton)
├── server/             # HTTP server + tracking HTML
├── types/              # TypeScript definitions
└── utils/              # Helper functions
```

## Coding Standards

- **TypeScript** for all source code
- **ESLint** for linting (`npm run lint`)
- **Meaningful names** for variables and functions
- **JSDoc comments** for public methods
- **Single responsibility** - keep functions focused

## Commit Messages

Use conventional commit format:
- `Add:` new feature
- `Fix:` bug fix
- `Update:` refactoring or updates
- `Remove:` removing code or files
- `Docs:` documentation changes

## Testing

Before submitting a PR:
1. Ensure `npm run compile` succeeds without errors
2. Test in Extension Development Host (F5)
3. Verify all gestures work correctly
4. Check for console errors

## Questions?

Feel free to open an issue for questions or discussions!

---

Thank you for contributing! 🙌
