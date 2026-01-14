declare module '@garmin/fitsdk' {
  export class Stream {
    static fromBuffer(buffer: Uint8Array): Stream;
    static toBuffer(): any;
  }

  export class Encoder {
    constructor(stream: any);
    writeFileId(data: {
      type: string;
      manufacturer: string | number;
      product: number;
      timeCreated: Date;
      serialNumber?: number;
    }): void;
    writeWorkout(data: {
      workoutName?: string;
      sport?: string;
      numValidSteps?: number;
    }): void;
    writeWorkoutStep(data: {
      messageIndex?: number;
      workoutStepName?: string;
      intensity?: number;
      durationType?: string;
      durationValue?: number;
      targetType?: number;
      customTargetValueLow?: number;
      customTargetValueHigh?: number;
    }): void;
    finish(): Uint8Array;
  }

  export class Decoder {
    constructor(stream: Stream);
    isFit(): boolean;
    checkIntegrity(): boolean;
    read(): {
      messages: {
        workoutMesgs?: Array<{
          workoutName?: string;
          sport?: string;
          numValidSteps?: number;
        }>;
        workoutStepMesgs?: Array<{
          messageIndex?: number;
          workoutStepName?: string;
          intensity?: number;
          durationType?: string;
          durationValue?: number;
          targetType?: number;
          customTargetValueLow?: number;
          customTargetValueHigh?: number;
        }>;
        [key: string]: any;
      };
    };
  }

  export namespace Profile {
    export enum MesgNum {
      FILE_ID = 0,
      WORKOUT = 26,
      WORKOUT_STEP = 27
    }
  }
}
