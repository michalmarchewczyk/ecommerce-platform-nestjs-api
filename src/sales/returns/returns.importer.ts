import { Injectable } from '@nestjs/common';
import { Importer } from '../../import-export/models/importer.interface';
import { Collection } from '../../import-export/models/collection.type';
import { ParseError } from '../../errors/parse.error';
import { IdMap } from '../../import-export/models/id-map.type';
import { ReturnsService } from './returns.service';
import { Return } from './models/return.entity';
import { ReturnStatus } from './models/return-status.enum';
import { ReturnCreateDto } from './dto/return-create.dto';

@Injectable()
export class ReturnsImporter implements Importer {
  constructor(private returnsService: ReturnsService) {}

  async import(
    returns: Collection,
    idMaps: Record<string, IdMap>,
  ): Promise<IdMap> {
    const parsedReturns = this.parseReturns(returns, idMaps.orders);
    const idMap: IdMap = {};
    for (const r of parsedReturns) {
      const { id, status, ...createDto } = r as any;
      const { id: newId } = await this.returnsService.createReturn(
        createDto,
        true,
      );
      await this.returnsService.updateReturn(newId, { status }, true);
      idMap[r.id] = newId;
    }
    return idMap;
  }

  async clear() {
    const returns = await this.returnsService.getReturns();
    let deleted = 0;
    for (const r of returns) {
      await this.returnsService.deleteReturn(r.id);
      deleted += 1;
    }
    return deleted;
  }

  private parseReturns(returns: Collection, ordersIdMap: IdMap) {
    const parsedReturns: Return[] = [];
    for (const r of returns) {
      parsedReturns.push(this.parseReturn(r, ordersIdMap));
    }
    return parsedReturns;
  }

  private parseReturn(r: Collection[number], ordersIdMap: IdMap) {
    const parsedReturn = new ReturnCreateDto() as any;
    try {
      parsedReturn.id = r.id as number;
      parsedReturn.created = new Date(r.created as string);
      parsedReturn.updated = new Date(r.updated as string);
      parsedReturn.message = r.message as string;
      parsedReturn.status = r.status as ReturnStatus;
      parsedReturn.orderId = ordersIdMap[r.orderId as number];
    } catch (e) {
      throw new ParseError('return');
    }
    return parsedReturn;
  }
}
