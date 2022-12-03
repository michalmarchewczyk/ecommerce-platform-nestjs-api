import { dataTypeDependencies } from './models/data-type-dependencies.data';
import { GenericError } from '../errors/generic.error';
import { DataType } from './models/data-type.enum';

const checkDataTypeDependencies = (data: string[]) => {
  for (const type of data) {
    const dependencies = dataTypeDependencies.find((d) => d[0] === type)?.[1];
    if (!dependencies) {
      throw new GenericError(`"${type}" is not recognized data type`);
    }
    for (const dependency of dependencies) {
      if (!data.includes(dependency)) {
        throw new GenericError(`"${type}" depends on "${dependency}"`);
      }
    }
  }
};

const checkDataType = (type: string): type is DataType => {
  return (
    type in DataType ||
    (Object.keys(DataType) as Array<keyof typeof DataType>).some(
      (k) => DataType[k] === type,
    )
  );
};

export { checkDataTypeDependencies, checkDataType };
