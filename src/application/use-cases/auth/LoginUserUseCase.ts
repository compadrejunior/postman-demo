import { InvalidCredentialsError } from "../../../domain/errors/InvalidCredentialsError.js";
import type { LoginUserInput, LoginUserOutput } from "../../dtos/AuthDtos.js";
import type { PasswordHasher } from "../../ports/PasswordHasher.js";
import type { TokenService } from "../../ports/TokenService.js";
import type { UserRepository } from "../../ports/UserRepository.js";

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.userRepository.findByEmail(input.email.trim().toLowerCase());
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const token = this.tokenService.sign({ userId: user.id, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email.value,
        role: user.role,
      },
    };
  }
}
