class InvalidPeriodError extends Error {}

class SalesReportService {
  constructor(saleRepository) {
    this.saleRepository = saleRepository;
  }

  resolvePeriod(period) {
    const now = new Date();

    let from;
    let to;

    switch (period) {
      case "today":
        from = new Date(now);
        from.setUTCHours(0, 0, 0, 0);

        to = new Date(now);
        to.setUTCHours(23, 59, 59, 999);
        break;

      case "week": {
        from = new Date(now);

        const day = from.getUTCDay();
        const daysSinceMonday = day === 0 ? 6 : day - 1;

        from.setUTCDate(
          from.getUTCDate() - daysSinceMonday
        );

        from.setUTCHours(0, 0, 0, 0);

        to = new Date(now);
        to.setUTCHours(23, 59, 59, 999);
        break;
      }

      case "month":
        from = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            1,
            0,
            0,
            0,
            0
          )
        );

        to = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() + 1,
            0,
            23,
            59,
            59,
            999
          )
        );
        break;

      case "all":
        from = "0000-01-01T00:00:00.000Z";
        to = "9999-12-31T23:59:59.999Z";
        break;

      default:
        throw new InvalidPeriodError(
          `Invalid period "${period}".`
        );
    }

    return {
      from: typeof from === "string"
        ? from
        : from.toISOString(),

      to: typeof to === "string"
        ? to
        : to.toISOString(),
    };
  }

  getSummary({ period }) {
    const { from, to } = this.resolvePeriod(period);

    const result =
      this.saleRepository.getRevenueSummary({
        from,
        to,
      });

    const totalRevenue = Number(result.totalRevenue);
    const saleCount = Number(result.saleCount);

    const averageSaleValue =
      saleCount === 0
        ? 0
        : Number((totalRevenue / saleCount).toFixed(2));

    return {
      totalRevenue,
      saleCount,
      averageSaleValue,
    };
  }

  getTopSellers({ period, limit = 5 }) {
    const { from, to } = this.resolvePeriod(period);

    return this.saleRepository.getTopSellingProducts({
      from,
      to,
      limit,
    });
  }

  getSalesList({ period, cashierId }) {
    const { from, to } = this.resolvePeriod(period);

    return this.saleRepository.listSales({
      from,
      to,
      cashierId,
    });
  }
}

module.exports = {
  SalesReportService,
  InvalidPeriodError,
};