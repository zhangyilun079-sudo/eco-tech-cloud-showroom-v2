import type { Exhibit } from './Exhibit';
import type { ExhibitDefinition } from './ExhibitDefinition';
import { mvrWastewaterTreatmentDefinition } from './data/mvrWastewaterTreatment';
import { rtoTreatmentDefinition } from './data/rtoTreatment';
import { MvrWastewaterTreatmentModel } from './models/MvrWastewaterTreatmentModel';
import { RtoTreatmentModel } from './models/rto/RtoTreatmentModel';

/** Creates heavyweight Viewer models only after a visitor selects an exhibit. */
export class ExhibitFactory {
  public create(definition: ExhibitDefinition): Exhibit {
    switch (definition.id) {
      case mvrWastewaterTreatmentDefinition.id:
        return new MvrWastewaterTreatmentModel(definition);
      case rtoTreatmentDefinition.id:
        return new RtoTreatmentModel(definition);
      default:
        throw new Error(`No exhibit factory registered for: ${definition.id}`);
    }
  }
}
