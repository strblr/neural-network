/**
 * A node in a neural network. Each node has a state
 * (total input, output, and their respectively derivatives) which changes
 * after every forward and back propagation run.
 */

export class Node {
  id: string;
  inputLinks: Link[] = [];
  bias = 0.1;
  outputs: Link[] = [];
  totalInput: number = 0;
  output: number = 0;
  /** Error derivative with respect to this node's output. */
  outputDer = 0;
  /** Error derivative with respect to this node's total input. */
  inputDer = 0;
  /**
   * Accumulated error derivative with respect to this node's total input since
   * the last update. This derivative equals dE/db where b is the node's
   * bias term.
   */
  accInputDer = 0;
  /**
   * Number of accumulated err. derivatives with respect to the total input
   * since the last update.
   */
  numAccumulatedDers = 0;
  /** Activation function that takes total input and returns node's output */
  activation: ActivationFunction;

  constructor(id: string, activation: ActivationFunction, initZero?: boolean) {
    this.id = id;
    this.activation = activation;
    if (initZero) {
      this.bias = 0;
    }
  }

  /** Recomputes the node's output and returns it. */
  updateOutput(): number {
    // Stores total input into the node.
    this.totalInput = this.bias;
    for (const link of this.inputLinks) {
      this.totalInput += link.weight * link.source.output;
    }
    this.output = this.activation.output(this.totalInput);
    return this.output;
  }
}

/**
 * A link in a neural network. Each link has a weight and a source and
 * destination node. Also it has an internal state (error derivative
 * with respect to a particular input) which gets updated after
 * a run of back propagation.
 */

export class Link {
  id: string;
  source: Node;
  dest: Node;
  weight = Math.random() - 0.5;
  isDead = false;
  /** Error derivative with respect to this weight. */
  errorDer = 0;
  /** Accumulated error derivative since the last update. */
  accErrorDer = 0;
  /** Number of accumulated derivatives since the last update. */
  numAccumulatedDers = 0;
  /**
   * The regularization function that computes the penalty for this
   * weight. If null, there will be no regularization.
   */
  regularization: RegularizationFunction;

  constructor(
    source: Node,
    dest: Node,
    regularization: RegularizationFunction,
    initZero?: boolean
  ) {
    this.id = source.id + "-" + dest.id;
    this.source = source;
    this.dest = dest;
    this.regularization = regularization;
    if (initZero) {
      this.weight = 0;
    }
  }
}

/** Error */

export interface OutputErrorFunction {
  error: (output: number, target: number) => number;
  der: (output: number, target: number) => number;
}

export class OutputError {
  static Square: OutputErrorFunction = {
    error: (output: number, target: number) =>
      0.5 * Math.pow(output - target, 2),
    der: (output: number, target: number) => output - target
  };
}

/** Activation */

export interface ActivationFunction {
  output: (input: number) => number;
  der: (input: number) => number;
}

export class Activation {
  static Tanh: ActivationFunction = {
    output: x => Math.tanh(x),
    der: x => 1 - Activation.Tanh.output(x) ** 2
  };
  static ReLU: ActivationFunction = {
    output: x => Math.max(0, x),
    der: x => (x <= 0 ? 0 : 1)
  };
  static Sigmoid: ActivationFunction = {
    output: x => 1 / (1 + Math.exp(-x)),
    der: x => {
      const output = Activation.Sigmoid.output(x);
      return output * (1 - output);
    }
  };
  static Linear: ActivationFunction = {
    output: x => x,
    der: () => 1
  };
}

/** Regularization */

export interface RegularizationFunction {
  output: (weight: number) => number;
  der: (weight: number) => number;
}

export class RegularizationFunction {
  static L1: RegularizationFunction = {
    output: w => Math.abs(w),
    der: w => (w < 0 ? -1 : w > 0 ? 1 : 0)
  };
  static L2: RegularizationFunction = {
    output: w => 0.5 * w * w,
    der: w => w
  };
}

/** Network */

export class Network {
  layers: Node[][] = [];

  /**
   * Builds a neural network.
   *
   * @param networkShape The shape of the network. E.g. [1, 2, 3, 1] means
   *   the network will have one input node, 2 nodes in first hidden layer,
   *   3 nodes in second hidden layer and 1 output node.
   * @param activation The activation function of every hidden node.
   * @param outputActivation The activation function for the output nodes.
   * @param regularization The regularization function that computes a penalty
   *     for a given weight (parameter) in the network. If null, there will be
   *     no regularization.
   * @param inputIds List of ids for the input nodes.
   * @param initZero Should all node and link weights be initialized to zero?
   */
  constructor(
    networkShape: number[],
    activation: ActivationFunction,
    outputActivation: ActivationFunction,
    regularization: RegularizationFunction,
    inputIds: string[],
    initZero?: boolean
  ) {
    const numLayers = networkShape.length;
    let id = 1;
    /** List of layers, with each layer being a list of nodes. */
    for (let layerIdx = 0; layerIdx < numLayers; layerIdx++) {
      const isOutputLayer = layerIdx === numLayers - 1;
      const isInputLayer = layerIdx === 0;
      const currentLayer: Node[] = [];
      this.layers.push(currentLayer);
      const numNodes = networkShape[layerIdx];
      for (let i = 0; i < numNodes; i++) {
        const nodeId = isInputLayer ? inputIds[i] : String(id++);
        const node = new Node(
          nodeId,
          isOutputLayer ? outputActivation : activation,
          initZero
        );
        currentLayer.push(node);
        if (layerIdx >= 1) {
          // Add links from nodes in the previous layer to this node.
          for (let j = 0; j < this.layers[layerIdx - 1].length; j++) {
            const prevNode = this.layers[layerIdx - 1][j];
            const link = new Link(prevNode, node, regularization, initZero);
            prevNode.outputs.push(link);
            node.inputLinks.push(link);
          }
        }
      }
    }
  }

  /**
   * Runs a forward propagation of the provided input through the provided
   * network. This method modifies the internal state of the network - the
   * total input and output of each node in the network.
   *
   * @param inputs The input array. Its length should match the number of input
   *     nodes in the network.
   * @return The final output of the network.
   */
  forwardProp(inputs: number[]) {
    const inputLayer = this.layers[0];
    if (inputs.length !== inputLayer.length) {
      throw new Error(
        "The number of inputs must match the number of nodes in" +
          " the input layer"
      );
    }
    // Update the input layer.
    for (let i = 0; i < inputLayer.length; i++) {
      const node = inputLayer[i];
      node.output = inputs[i];
    }
    for (let layerIdx = 1; layerIdx < this.layers.length; layerIdx++) {
      const currentLayer = this.layers[layerIdx];
      // Update all the nodes in this layer.
      for (let i = 0; i < currentLayer.length; i++) {
        const node = currentLayer[i];
        node.updateOutput();
      }
    }
    return this.layers[this.layers.length - 1][0].output;
  }

  /**
   * Runs a backward propagation using the provided target and the
   * computed output of the previous call to forward propagation.
   * This method modifies the internal state of the network - the error
   * derivatives with respect to each node, and each weight
   * in the network.
   */
  backProp(target: number, errorFunc: OutputErrorFunction) {
    // The output node is a special case. We use the user-defined error
    // function for the derivative.
    const outputNode = this.layers[this.layers.length - 1][0];
    outputNode.outputDer = errorFunc.der(outputNode.output, target);

    // Go through the layers backwards.
    for (let layerIdx = this.layers.length - 1; layerIdx >= 1; layerIdx--) {
      const currentLayer = this.layers[layerIdx];
      // Compute the error derivative of each node with respect to:
      // 1) its total input
      // 2) each of its input weights.
      for (let i = 0; i < currentLayer.length; i++) {
        const node = currentLayer[i];
        node.inputDer = node.outputDer * node.activation.der(node.totalInput);
        node.accInputDer += node.inputDer;
        node.numAccumulatedDers++;
      }

      // Error derivative with respect to each weight coming into the node.
      for (let i = 0; i < currentLayer.length; i++) {
        const node = currentLayer[i];
        for (let j = 0; j < node.inputLinks.length; j++) {
          const link = node.inputLinks[j];
          if (link.isDead) {
            continue;
          }
          link.errorDer = node.inputDer * link.source.output;
          link.accErrorDer += link.errorDer;
          link.numAccumulatedDers++;
        }
      }
      if (layerIdx === 1) {
        continue;
      }
      const prevLayer = this.layers[layerIdx - 1];
      for (let i = 0; i < prevLayer.length; i++) {
        const node = prevLayer[i];
        // Compute the error derivative with respect to each node's output.
        node.outputDer = 0;
        for (let j = 0; j < node.outputs.length; j++) {
          const output = node.outputs[j];
          node.outputDer += output.weight * output.dest.inputDer;
        }
      }
    }
  }

  /**
   * Updates the weights & biases of the network using the previously
   * accumulated error derivatives.
   */
  updateWeights(learningRate: number, regularizationRate: number) {
    for (let layerIdx = 1; layerIdx < this.layers.length; layerIdx++) {
      const currentLayer = this.layers[layerIdx];
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
        for (let j = 0; j < node.inputLinks.length; j++) {
          const link = node.inputLinks[j];
          if (link.isDead) {
            continue;
          }
          const regulDer = link.regularization
            ? link.regularization.der(link.weight)
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
              link.regularization === RegularizationFunction.L1 &&
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
  }

  /** Iterates over every node in the network/ */
  forEach(
    ignoreInputs: boolean,
    accessor: (node: Node, layerIdx: number, i: number) => void
  ) {
    for (
      let layerIdx = ignoreInputs ? 1 : 0;
      layerIdx < this.layers.length;
      layerIdx++
    ) {
      const currentLayer = this.layers[layerIdx];
      for (let i = 0; i < currentLayer.length; i++) {
        const node = currentLayer[i];
        accessor(node, layerIdx, i);
      }
    }
  }

  /** Returns the output node in the network. */
  getOutputNode() {
    return this.layers[this.layers.length - 1][0];
  }
}
