import { MantineThemeOverride } from "@mantine/core";

export const lightTheme: MantineThemeOverride = {
  colorScheme: "dark",
  globalStyles: () => ({
    "#root": {
      height: "100vh",
      display: "flex"
    },
    "@keyframes linkflow": {
      from: { strokeDashoffset: 0 },
      to: { strokeDashoffset: -10 }
    },
    ".link": {
      // animation: "1s linear infinite linkflow"
    }
  }),
  components: {}
};

export const darkTheme: MantineThemeOverride = { ...lightTheme };
