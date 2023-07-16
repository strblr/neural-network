/* Problem */

export enum ProblemType {
  Classification = "Classification",
  Regression = "Regression"
}

/** Activation */

export enum ActivationType {
  Tanh = "Tanh",
  ReLU = "ReLU",
  Sigmoid = "Sigmoid",
  Linear = "Linear"
}

export interface ActivationFunction {
  output: (input: number) => number;
  der: (input: number) => number;
}

export const Activation: Record<ActivationType, ActivationFunction> = {
  [ActivationType.Tanh]: {
    output: x => Math.tanh(x),
    der: x => 1 - Activation.Tanh.output(x) ** 2
  },
  [ActivationType.ReLU]: {
    output: x => Math.max(0, x),
    der: x => (x <= 0 ? 0 : 1)
  },
  [ActivationType.Sigmoid]: {
    output: x => 1 / (1 + Math.exp(-x)),
    der: x => {
      const output = Activation.Sigmoid.output(x);
      return output * (1 - output);
    }
  },
  [ActivationType.Linear]: {
    output: x => x,
    der: () => 1
  }
};

/** Error */

export enum OutputErrorType {
  Square = "Square sum",
  MeanSquare = "Mean square"
}

export interface OutputErrorFunction {
  error: (outputs: number[], targets: number[]) => number;
  der: (output: number, target: number, outputLength: number) => number;
}

export const OutputError: Record<OutputErrorType, OutputErrorFunction> = {
  [OutputErrorType.Square]: {
    error: (outputs: number[], targets: number[]) =>
      outputs.reduce(
        (sum, output, i) => sum + Math.pow(output - targets[i], 2),
        0
      ) / 2,
    der: (output: number, target: number) => output - target
  },
  [OutputErrorType.MeanSquare]: {
    error: (outputs: number[], targets: number[]) =>
      outputs.reduce(
        (sum, output, i) => sum + Math.pow(output - targets[i], 2),
        0
      ) / outputs.length,
    der: (output: number, target: number, outputLength) =>
      (2 / outputLength) * (output - target)
  }
};

/** Regularization */

export enum RegularizationType {
  L1 = "L1",
  L2 = "L2"
}

export interface RegularizationFunction {
  output: (weight: number) => number;
  der: (weight: number) => number;
}

export const Regularization: Record<
  RegularizationType,
  RegularizationFunction
> = {
  [RegularizationType.L1]: {
    output: w => Math.abs(w),
    der: w => (w < 0 ? -1 : w > 0 ? 1 : 0)
  },
  [RegularizationType.L2]: {
    output: w => 0.5 * w * w,
    der: w => w
  }
};
