import { AttributeOperatorType } from './attributeOperatorType';

export type MetadataFilter = {
  id: number
  attributeName: string
  operator: AttributeOperatorType
  attributeValue: string,
  tokenWeight: number
};
