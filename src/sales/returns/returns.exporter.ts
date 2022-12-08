import { Injectable } from '@nestjs/common';
import { Exporter } from '../../import-export/models/exporter.interface';
import { Return } from './models/return.entity';
import { ReturnsService } from './returns.service';

@Injectable()
export class ReturnsExporter implements Exporter<Return> {
  constructor(private returnsService: ReturnsService) {}

  async export(): Promise<Return[]> {
    const returns = await this.returnsService.getReturns();
    const preparedReturns: Return[] = [];
    for (const r of returns) {
      preparedReturns.push(this.prepareReturn(r));
    }
    return preparedReturns;
  }

  private prepareReturn(r: Return) {
    const preparedReturn = new Return() as any;
    preparedReturn.id = r.id;
    preparedReturn.created = r.created;
    preparedReturn.updated = r.updated;
    preparedReturn.message = r.message;
    preparedReturn.status = r.status;
    preparedReturn.orderId = r.order.id;
    return preparedReturn;
  }
}
