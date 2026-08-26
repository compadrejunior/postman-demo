import { User } from "../../../domain/entities/User.js";
import { UserAlreadyExistsError } from "../../../domain/errors/UserAlreadyExistsError.js";
import { Email } from "../../../domain/value-objects/Email.js";
import type { RegisterUserInput, RegisterUserOutput } from "../../dtos/AuthDtos.js";
import type { Clock } from "../../ports/Clock.js";
import type { IdGenerator } from "../../ports/IdGenerator.js";
import type { PasswordHasher } from "../../ports/PasswordHasher.js";
import type { UserRepository } from "../../ports/UserRepository.js";

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const email = Email.create(input.email);

    const existingUser = await this.userRepository.findByEmail(email.value);
    if (existingUser) {
      throw new UserAlreadyExistsError(email.value);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({
      id: this.idGenerator.generate(),
      name: input.name,
      email,
      passwordHash,
      role: "user",
      createdAt: this.clock.now(),
    });

    await this.userRepository.save(user);

    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      role: user.role,
    };
  }
}
