import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Input,
  NumberInput,
  SimpleGrid,
  Stack,
  Sx,
  Title
} from "@mantine/core";
import { shallow } from "zustand/shallow";
import { drop, isNumber, omit, take } from "lodash-es";
import { useStore } from "@/session/store";
import { IconMinus, IconPlus } from "@tabler/icons-react";

export default function Aside() {
  const { shape, randomize, epoch, initLayers, forwardProp } = useStore(
    store => omit(store, "layers"),
    shallow
  );

  const addLayer = () => {
    const nextShape = [...shape];
    nextShape.splice(nextShape.length - 1, 0, 4);
    initLayers({ shape: nextShape });
  };

  const updateLayer = (index: number, value: number) => {
    const nextShape = [...shape];
    nextShape[index] = value;
    initLayers({ shape: nextShape });
  };

  const dropLayer = () => {
    const nextShape = [...shape];
    nextShape.splice(nextShape.length - 2, 1);
    initLayers({ shape: nextShape });
  };

  return (
    <Box component="aside" sx={asideSx}>
      <Box mx="md" my="lg">
        <Title order={2}>Neural playground</Title>
        <Title order={4}>Epoch {epoch}</Title>
      </Box>
      <Accordion multiple defaultValue={["shape"]}>
        <Accordion.Item value="shape">
          <Accordion.Control>Shape ({shape.length})</Accordion.Control>
          <Accordion.Panel>
            <Stack spacing="xs">
              <NumberInput
                label="Input layer"
                value={shape[0]}
                onChange={value => isNumber(value) && updateLayer(0, value)}
              />
              <Input.Wrapper label="Hidden layers">
                <SimpleGrid cols={4}>
                  {take(drop(shape, 1), shape.length - 2).map((layer, i) => (
                    <NumberInput
                      key={i}
                      value={layer}
                      onChange={value =>
                        isNumber(value) && updateLayer(i + 1, value)
                      }
                    />
                  ))}
                  <Group spacing={4}>
                    <ActionIcon variant="light" onClick={addLayer}>
                      <IconPlus />
                    </ActionIcon>
                    <ActionIcon variant="light" onClick={dropLayer}>
                      <IconMinus />
                    </ActionIcon>
                  </Group>
                </SimpleGrid>
              </Input.Wrapper>
              <NumberInput
                label="Output layer"
                value={shape[shape.length - 1]}
                onChange={value =>
                  isNumber(value) && updateLayer(shape.length - 1, value)
                }
              />
              <Group>
                <Button variant="default" onClick={() => initLayers()}>
                  Reinitialize
                </Button>
                <Checkbox
                  label="Randomize"
                  checked={randomize}
                  onChange={e => initLayers({ randomize: e.target.checked })}
                />
              </Group>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="settings">
          <Accordion.Control>Settings</Accordion.Control>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="training">
          <Accordion.Control>Training</Accordion.Control>
          <Accordion.Panel>
            <Button onClick={() => forwardProp([4, -5])}>Forward prop</Button>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  );
}

// Styles

const asideSx: Sx = theme => ({
  width: 400,
  flexShrink: 0,
  borderLeft: `1px solid ${theme.colors.gray[8]}`
});
