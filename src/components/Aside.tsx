import { Box, Button, Sx } from "@mantine/core";

export default function Aside() {
  return (
    <Box component="aside" sx={asideSx}>
      <Button>Test</Button>
    </Box>
  );
}

// Styles

const asideSx: Sx = theme => ({
  width: 320,
  flexShrink: 0,
  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
  borderLeft: `1px solid ${theme.colors.gray[5]}`
});
