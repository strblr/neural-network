import { create } from "zustand";
import { persist } from "zustand/middleware";
import { parse, stringify } from "flatted";
import {
  Activation,
  ActivationType,
  OutputError,
  OutputErrorType,
  Regularization,
  RegularizationType
} from "@/session/constants.tsx";

// State and actions

export interface Store extends NetworkState, LearningState, Actions {}

export interface NetworkState {
  layers: Node[][];
  shape: number[];
  randomize: boolean;
  activation: ActivationType;
  outputActivation: ActivationType;
  outputError: OutputErrorType;
  regularization: RegularizationType | null;
  regularizationRate: number;
  learningRate: number;
}

export interface LearningState {
  epoch: number;
  trainingToTestRatio: number;
  batchSize: number;
  lossStats: Record<"training" | "test", number>[];
}

export interface Actions {
  initLayers: (state?: Partial<NetworkState>) => void;
  forwardProp: (inputs: number[]) => number[];
  backProp: (targets: number[]) => void;
  updateWeights: () => void;
}

export interface Node {
  id: string;
  inputs: Link[];
  outputs: Link[];
  bias: number;
  totalInput: number;
  output: number;
  outputDer: number;
  inputDer: number;
  accInputDer: number;
  numAccumulatedDers: number;
  activation: ActivationType;
}

export interface Link {
  id: string;
  source: Node;
  dest: Node;
  weight: number;
  isDead: boolean;
  errorDer: number;
  accErrorDer: number;
  numAccumulatedDers: number;
  regularization: RegularizationType | null;
}

const defaultNetworkState: NetworkState = {
  layers: [],
  shape: [30, 24, 22, 10],
  randomize: true,
  activation: ActivationType.ReLU,
  outputActivation: ActivationType.Tanh,
  outputError: OutputErrorType.Square,
  regularization: null,
  regularizationRate: 0,
  learningRate: 0.03
};

const defaultLearningState: LearningState = {
  epoch: 0,
  trainingToTestRatio: 50,
  batchSize: 10,
  lossStats: []
};

const actions: (
  ...args: Parameters<Parameters<typeof persist<Store>>[0]>
) => Actions = (set, get) => ({
  initLayers(state) {
    const {
      shape,
      randomize,
      activation,
      outputActivation,
      regularization
    }: NetworkState = {
      ...get(),
      ...state
    };

    const layers: Node[][] = [];
    const layerCount = shape.length;

    // List of layers, with each layer being a list of nodes.
    for (let l = 0; l < layerCount; l++) {
      const isOutputLayer = l === layerCount - 1;
      const currentLayer: Node[] = [];
      layers.push(currentLayer);

      for (let n = 0; n < shape[l]; n++) {
        const node: Node = {
          id: `${l}-${n}`,
          inputs: [],
          outputs: [],
          bias: randomize ? 0.1 : 0,
          totalInput: 0,
          output: 0,
          outputDer: 0,
          inputDer: 0,
          accInputDer: 0,
          numAccumulatedDers: 0,
          activation: isOutputLayer ? outputActivation : activation
        };
        currentLayer.push(node);
        if (l >= 1) {
          // Add links from nodes in the previous layer to this node.
          for (const prevNode of layers[l - 1]) {
            const link: Link = {
              id: `${prevNode.id}->${node.id}`,
              source: prevNode,
              dest: node,
              weight: randomize ? Math.random() - 0.5 : 0,
              isDead: false,
              errorDer: 0,
              accErrorDer: 0,
              numAccumulatedDers: 0,
              regularization
            };
            prevNode.outputs.push(link);
            node.inputs.push(link);
          }
        }
      }
    }

    set({ layers, ...state, epoch: 0 });
  },

  forwardProp(inputs) {
    const { layers } = get();
    const [inputLayer, ...otherLayers] = layers;

    if (inputs.length !== inputLayer.length) {
      throw new Error(
        "The number of inputs must match the number of nodes in" +
          " the input layer"
      );
    }
    // Update the input layer
    for (let i = 0; i < inputLayer.length; i++) {
      const node = inputLayer[i];
      node.output = inputs[i];
    }
    for (const layer of otherLayers) {
      for (const node of layer) {
        // Update all the nodes in this layer
        node.totalInput = node.bias;
        for (const link of node.inputs) {
          node.totalInput += link.weight * link.source.output;
        }
        node.output = Activation[node.activation].output(node.totalInput);
      }
    }

    set({ layers: [...layers] });
    return layers[layers.length - 1].map(node => node.output);
  },

  backProp(targets) {
    const { layers, outputError } = get();
    // The output layer is a special case. We use the user-defined error
    // function for the derivative.
    const outputLayer = layers[layers.length - 1];
    for (let i = 0; i < outputLayer.length; i++) {
      const node = outputLayer[i];
      node.outputDer = OutputError[outputError].der(
        node.output,
        targets[i],
        outputLayer.length
      );
    }

    // Go through the layers backwards.
    for (let l = layers.length - 1; l >= 1; l--) {
      const currentLayer = layers[l];
      // Compute the error derivative of each node with respect to:
      // 1) its total input
      // 2) each of its input weights.
      for (const node of currentLayer) {
        node.inputDer =
          node.outputDer * Activation[node.activation].der(node.totalInput);
        node.accInputDer += node.inputDer;
        node.numAccumulatedDers++;
      }

      // Error derivative with respect to each weight coming into the node.
      for (const node of currentLayer) {
        for (const link of node.inputs) {
          if (link.isDead) continue;
          link.errorDer = node.inputDer * link.source.output;
          link.accErrorDer += link.errorDer;
          link.numAccumulatedDers++;
        }
      }
      if (l === 1) {
        continue;
      }
      const prevLayer = layers[l - 1];
      for (const node of prevLayer) {
        // Compute the error derivative with respect to each node's output.
        node.outputDer = 0;
        for (const output of node.outputs) {
          node.outputDer += output.weight * output.dest.inputDer;
        }
      }
    }

    set({ layers: [...layers] });
  },

  updateWeights() {
    const { learningRate, regularizationRate, layers } = get();

    for (let l = 1; l < layers.length; l++) {
      const currentLayer = layers[l];
      for (let i = 0; i < currentLayer.length; i++) {
        const node = currentLayer[i];
        // Update the node's bias.
        if (node.numAccumulatedDers > 0) {
          node.bias -=
            (learningRate * node.accInputDer) / node.numAccumulatedDers;
          node.accInputDer = 0;
          node.numAccumulatedDers = 0;
        }
        // Update the weights coming into this node.
        for (let j = 0; j < node.inputs.length; j++) {
          const link = node.inputs[j];
          if (link.isDead) {
            continue;
          }
          const regulDer = link.regularization
            ? Regularization[link.regularization].der(link.weight)
            : 0;
          if (link.numAccumulatedDers > 0) {
            // Update the weight based on dE/dw.
            link.weight =
              link.weight -
              (learningRate / link.numAccumulatedDers) * link.accErrorDer;
            // Further update the weight based on regularization.
            const newLinkWeight =
              link.weight - learningRate * regularizationRate * regulDer;
            if (
              link.regularization === RegularizationType.L1 &&
              link.weight * newLinkWeight < 0
            ) {
              // The weight crossed 0 due to the regularization term. Set it to 0.
              link.weight = 0;
              link.isDead = true;
            } else {
              link.weight = newLinkWeight;
            }
            link.accErrorDer = 0;
            link.numAccumulatedDers = 0;
          }
        }
      }
    }

    set({ layers: [...layers] });
  }
});

// Final store

export const useStore = create(
  persist<Store>(
    (...args) => ({
      ...defaultNetworkState,
      ...defaultLearningState,
      ...actions(...args)
    }),
    {
      name: "neural-network",
      serialize: state => stringify(state),
      deserialize: state => parse(state)
    }
  )
);

if (useStore.getState().layers.length === 0) {
  useStore.getState().initLayers();
}
