# Contributing to SignSpeak AI

Thank you for your interest in contributing to SignSpeak AI! We welcome contributions from the community to help make sign language translation more accessible to everyone.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/signspeak-ai.git
   cd signspeak-ai
   ```
3. Run the setup script:
   ```bash
   ./setup.sh
   ```
4. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Process

### 1. Before You Start
- Check existing issues and PRs to avoid duplicate work
- For major changes, open an issue first to discuss
- Ensure your development environment is set up correctly

### 2. Code Style
We use automated formatting tools to maintain consistency:

**Python (Backend)**
```bash
cd backend
source venv/bin/activate
black .
isort .
flake8 .
```

**TypeScript/React (Frontend)**
```bash
cd frontend
npm run lint
npm run format
```

### 3. Testing
All contributions must include appropriate tests:

**Backend Testing**
```bash
cd backend
pytest tests/
```

**Frontend Testing**
```bash
cd frontend
npm test
```

### 4. Commit Messages
Follow conventional commit format:
```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example:
```
feat(avatar): add smooth transition between gestures

Implemented animation blending for natural transitions
between sign language gestures using Three.js mixer.

Closes #123
```

## Architecture Guidelines

### Backend Structure
```
backend/app/
├── api/        # API endpoints
├── services/   # Business logic
├── models/     # Data models
├── utils/      # Utilities
└── config/     # Configuration
```

### Frontend Structure
```
frontend/src/
├── components/ # React components
├── services/   # API services
├── hooks/      # Custom hooks
├── types/      # TypeScript types
└── utils/      # Utilities
```

## Areas for Contribution

### High Priority
- [ ] Additional sign language gestures
- [ ] Performance optimizations
- [ ] Accessibility improvements
- [ ] Multi-language support
- [ ] Mobile responsiveness

### Features Welcome
- [ ] Offline mode
- [ ] Custom gesture training
- [ ] Voice customization
- [ ] Export/sharing features
- [ ] Analytics enhancements

### Documentation
- [ ] API documentation
- [ ] User guides
- [ ] Video tutorials
- [ ] Translation accuracy metrics

## Pull Request Process

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all tests**
   ```bash
   ./test-backend.sh
   ./test-frontend.sh
   ```

3. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Include screenshots for UI changes
   - Describe testing performed

4. **PR Checklist**
   - [ ] Code follows project style guidelines
   - [ ] Tests pass locally
   - [ ] New features include tests
   - [ ] Documentation updated if needed
   - [ ] No console errors or warnings
   - [ ] Performance impact considered

## Reporting Issues

### Bug Reports
Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, versions)
- Screenshots or error logs

### Feature Requests
Include:
- Problem you're trying to solve
- Proposed solution
- Alternative solutions considered
- Mockups or examples if applicable

## Communication

- **Discord**: [Join our server](https://discord.gg/signspeak)
- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Use GitHub Issues for bugs and features

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior
- Harassment or discriminatory language
- Personal attacks or trolling
- Publishing private information
- Inappropriate sexual content
- Other unprofessional conduct

## Recognition

Contributors will be:
- Listed in our CONTRIBUTORS.md file
- Mentioned in release notes
- Given credit in project documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make sign language translation accessible to everyone!