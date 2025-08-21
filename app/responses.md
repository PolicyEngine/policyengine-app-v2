# PR #112 review responses

Thanks for the thorough review. Here's my response to the key issues raised:

## Blocking issues

### API connections
The mocked API connections need to be restored. The original implementation should be preserved to maintain proper backend connectivity. I'll work through each mocked endpoint to restore the real connections.

### GitHub Actions workflows
The PR testing workflows are now restored in `.github/workflows/pr.yaml` which runs type checks, linting, tests and build on all PRs to master/main. Additionally, `.github/workflows/push.yaml` handles deployment to GitHub Pages on merges.

### Node.js version
All Dockerfiles should be updated to use Node 22 instead of the EOL Node 18. This is a straightforward update across the affected files.

## Styling and architecture

### CSS modules vs theme approach
The CSS modules approach conflicts with the existing Mantine theme system. The app should maintain consistency by using the theme-based styling approach already established in the codebase. I'll refactor the new components to use the existing styling patterns.

### AppShell restructuring
The Mantine AppShell component placement is causing formatting issues. It should either be moved above the layout level or restructured to work properly within the existing component hierarchy.

## Minor fixes

### Sentence case
All labels and UI text should follow sentence case per project standards. This includes navigation items, buttons, and other user-facing text.

### Vite deployment
The removal of Vite from deployment needs clarification. If it was intentional for a specific reason, that should be documented. Otherwise, it should be restored to maintain the build process.

## Next steps

1. Restore all API connections to their original state
2. Update Node.js to version 22 in all Dockerfiles
3. Refactor CSS modules to use theme-based styling
4. Restructure or relocate AppShell component
5. Fix all title case instances to sentence case
6. Clarify Vite deployment changes

The GitHub Actions workflows have already been set up to ensure code quality on future PRs.