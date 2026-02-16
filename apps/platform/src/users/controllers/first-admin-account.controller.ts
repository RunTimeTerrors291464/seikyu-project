import { Controller } from '@nestjs/common';

// Import TCP message pattern.
import { MessagePattern } from '@nestjs/microservices';

// Import services.
import { FirstAdminAccountService } from '../services/first-admin-account.service';

// Import DTOs.
import { CreateUserAdminRequestDto } from '@app/common/dtos/platform/users/crudUsersRequest.dto';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

@Controller('first-admin-account')
export class FirstAdminAccountController {
    constructor(
        private readonly firstAdminAccountService: FirstAdminAccountService
    ) { }

    // Create the first admin account.
    @MessagePattern({ cmd: 'firstAdminAccount.createFirstAdminAccount' })
    async createFirstAdminAccount(dto: CreateUserAdminRequestDto): Promise<UserResponseDto> {
        return this.firstAdminAccountService.createFirstAdminAccount(dto);
    }
}
