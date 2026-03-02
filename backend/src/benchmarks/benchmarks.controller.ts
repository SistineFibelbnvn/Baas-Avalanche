import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { BenchmarksService, TpsBenchmarkConfig } from './benchmarks.service';
import { CreateBenchmarkDto } from './dto/create-benchmark.dto';

@Controller('benchmarks')
export class BenchmarksController {
  constructor(private readonly benchmarksService: BenchmarksService) { }

  @Get()
  list() {
    return this.benchmarksService.list();
  }

  @Post()
  create(@Body() dto: CreateBenchmarkDto) {
    return this.benchmarksService.create(dto);
  }

  // Run real-time TPS benchmark
  @Post('run-tps')
  runTpsTest(@Body() config: TpsBenchmarkConfig) {
    return this.benchmarksService.runTpsTest(config);
  }

  // Run quick read-only benchmark
  @Get('read-test')
  runReadBenchmark(
    @Query('rpcUrl') rpcUrl: string = 'http://127.0.0.1:9650/ext/bc/C/rpc',
    @Query('iterations') iterations: string = '100',
  ) {
    return this.benchmarksService.runReadBenchmark(rpcUrl, parseInt(iterations));
  }
}

