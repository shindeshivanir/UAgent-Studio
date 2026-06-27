export interface UATStep {
  stepNumber: number;
  module: string;
  instruction: string;
  expectedResult: string;
  actualResults: string;
  stepStatus: string;
  remarks: string;
  roleOverride?: string;
  needsReview?: boolean;
}

export interface UATMetadata {
  scriptNumber: string;
  scenarioTitle: string;
  role: string;
  testedBy: string;
  testingDate: string;
  testingStatus: string;
  additionalComments: string;
  subScenarioNo: string;
  subScenario: string;
  description: string;
  prerequisite: string;
}

export interface UATScript {
  metadata: UATMetadata;
  steps: UATStep[];
}
