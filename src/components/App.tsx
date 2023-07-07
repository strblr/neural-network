import { useState } from "react";
import { MantineProvider } from "@mantine/core";
import { darkTheme, lightTheme } from "@/session/theme.tsx";
import Main from "@/components/Main.tsx";
import Aside from "@/components/Aside.tsx";

function App() {
  const [dark] = useState(false);
  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={dark ? darkTheme : lightTheme}
    >
      <Main />
      <Aside />
    </MantineProvider>
  );
}

export default App;
