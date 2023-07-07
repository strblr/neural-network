import { MantineThemeOverride } from "@mantine/core";

export const lightTheme: MantineThemeOverride = {
  globalStyles: () => ({
    "#root": {
      height: "100vh",
      display: "flex"
    }
  })
};

export const darkTheme: MantineThemeOverride = { ...lightTheme };
