import { Box, Button, Sx } from "@mantine/core";

export default function Main() {
  return (
    <Box component="main" sx={mainSx}>
      <Button>Test</Button>
    </Box>
  );
}

// Styles

const mainSx: Sx = {
  flexGrow: 1
};
