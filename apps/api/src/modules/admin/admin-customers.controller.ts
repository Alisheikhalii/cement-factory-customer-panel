import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AdminCustomerDto,
  AuthUser,
  CreateCustomerResult,
  ResetCustomerPasswordResult,
} from '@cement/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ResponseWithMeta } from '../../common/http/response-with-meta';
import { WriteThrottle } from '../../common/throttling/write-throttle.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AdminCustomersService } from './admin-customers.service';

/**
 * کنترلر مدیریت مشتریان توسط ادمین (بخش ۹.۹.۲ / ۱۱.۱۰) — نقش ADMIN.
 * مسیر: /api/v1/admin/customers
 */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(private readonly service: AdminCustomersService) {}

  @Get()
  @ApiOperation({ summary: 'لیست/جستجوی مشتریان' })
  list(
    @Query('search') search: string | undefined,
    @Query() query: PaginationQueryDto,
  ): Promise<ResponseWithMeta<AdminCustomerDto[]>> {
    return this.service.list(search, query);
  }

  @Post()
  @WriteThrottle()
  @ApiOperation({ summary: 'ایجاد مشتری + کاربر جدید (BR-26/BR-28)' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateCustomerDto,
  ): Promise<CreateCustomerResult> {
    return this.service.create(body, user.userId, user.fullName ?? user.username);
  }

  @Patch(':id')
  @WriteThrottle()
  @ApiOperation({ summary: 'ویرایش اطلاعات مشتری' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateCustomerDto,
  ): Promise<AdminCustomerDto> {
    return this.service.update(id, body);
  }

  @Patch(':id/toggle-active')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'فعال/غیرفعال کردن حساب مشتری' })
  toggleActive(@Param('id') id: string): Promise<AdminCustomerDto> {
    return this.service.toggleActive(id);
  }

  @Patch(':id/reset-password')
  @WriteThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'بازنشانی رمز عبور مشتری (رمز موقت جدید)' })
  resetPassword(@Param('id') id: string): Promise<ResetCustomerPasswordResult> {
    return this.service.resetPassword(id);
  }
}
