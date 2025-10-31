import { Box, Center, Text } from '@mantine/core';

export default function PolicyParameterSelectorEmptyMain() {
  return (
    <Center
      style={{
        // Use Mantine's AppShell CSS variables to calculate the exact height of the Main area
        // 100vh - header height - footer height - padding (top + bottom, hence * 2)
        // This ensures the text is vertically centered in the available space
        // Unfortunately, AppShell.Main isn't flexbox, so we can't easily flex this out
        height: 'calc(100vh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px) - var(--app-shell-padding, 0px) * 2)',
        width: "100%"
      }}
    >
      <Box>
        <Text>
          Build a tax-benefit reform by selecting parameters from the menu, organized by government
          department.
        </Text>
      </Box>
    </Center>
  );
}
