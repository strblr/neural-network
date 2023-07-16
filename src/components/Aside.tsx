import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Input,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Sx,
  Title
} from "@mantine/core";
import { shallow } from "zustand/shallow";
import { drop, isNumber, pick, take, values } from "lodash-es";
import { useStore } from "@/session/store";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import {
  ActivationType,
  OutputErrorType,
  RegularizationType
} from "@/session/constants.tsx";

// Aside

export default function Aside() {
  return (
    <Box component="aside" sx={asideSx}>
      <Box mx="md" my="lg">
        <Title order={2}>Neural playground</Title>
      </Box>
      <Accordion multiple defaultValue={["settings"]}>
        <NetworkSettings />
        <TrainingSettings />
      </Accordion>
    </Box>
  );
}

// NetworkSettings

function NetworkSettings() {
  const {
    shape,
    randomize,
    activation,
    outputActivation,
    outputError,
    regularization,
    regularizationRate,
    learningRate,
    initLayers
  } = useStore(
    store =>
      pick(store, [
        "shape",
        "randomize",
        "activation",
        "outputActivation",
        "outputError",
        "regularization",
        "regularizationRate",
        "learningRate",
        "initLayers"
      ]),
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
    <Accordion.Item value="settings">
      <Accordion.Control>Settings</Accordion.Control>
      <Accordion.Panel>
        <Divider label={`Shape (${shape.length})`} />
        <Stack spacing="xs">
          <Input.Wrapper label="Input layer">
            <SimpleGrid cols={4}>
              <NumberInput
                value={shape[0]}
                onChange={value => isNumber(value) && updateLayer(0, value)}
              />
            </SimpleGrid>
          </Input.Wrapper>
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
          <Input.Wrapper label="Output layer">
            <SimpleGrid cols={4}>
              <NumberInput
                value={shape[shape.length - 1]}
                onChange={value =>
                  isNumber(value) && updateLayer(shape.length - 1, value)
                }
              />
            </SimpleGrid>
          </Input.Wrapper>
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
        <Divider label="Activation" mt="xl" />
        <Stack spacing="xs">
          <Select
            label="Activation"
            data={values(ActivationType)}
            value={activation}
            onChange={activation =>
              initLayers({ activation: activation as ActivationType })
            }
          />
          <Select
            label="Output activation"
            data={values(ActivationType)}
            value={outputActivation}
            onChange={activation =>
              initLayers({ outputActivation: activation as ActivationType })
            }
          />
        </Stack>
        <Divider label="Training" mt="xl" />
        <Stack spacing="xs">
          <SimpleGrid cols={2}>
            <Select
              label="Cost function"
              data={values(OutputErrorType)}
              value={outputError}
              onChange={outputError =>
                initLayers({ outputError: outputError as OutputErrorType })
              }
            />
            <Select
              label="Learning rate"
              placeholder="None"
              data={[
                0.00001, 0.0001, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10
              ].map(String)}
              value={String(learningRate)}
              onChange={learningRate =>
                initLayers({
                  learningRate: Number(learningRate)
                })
              }
            />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <Select
              clearable
              label="Regularization"
              placeholder="None"
              data={values(RegularizationType)}
              value={regularization}
              onChange={regularization =>
                initLayers({
                  regularization: regularization as RegularizationType | null
                })
              }
            />
            <Select
              label="Regularization rate"
              placeholder="None"
              disabled={!regularization}
              data={[0, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10].map(
                String
              )}
              value={String(regularizationRate)}
              onChange={regularizationRate =>
                initLayers({
                  regularizationRate: Number(regularizationRate)
                })
              }
            />
          </SimpleGrid>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

// TrainingSettings

function TrainingSettings() {
  const { forwardProp } = useStore(
    store => pick(store, ["epoch", "forwardProp"]),
    shallow
  );

  return (
    <Accordion.Item value="training">
      <Accordion.Control>Training</Accordion.Control>
      <Accordion.Panel>
        <Button onClick={() => forwardProp([4, -5])}>Forward prop</Button>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

// Styles

const asideSx: Sx = theme => ({
  width: 400,
  flexShrink: 0,
  borderLeft: `1px solid ${theme.colors.gray[8]}`
});
