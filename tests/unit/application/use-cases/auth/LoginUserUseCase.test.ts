import { beforeEach, describe, expect, it } from "vitest";
import { LoginUserUseCase } from "../../../../../src/application/use-cases/auth/LoginUserUseCase.js";
import { InvalidCredentialsError } from "../../../../../src/domain/errors/InvalidCredentialsError.js";
import { User } from "../../../../../src/domain/entities/User.js";
import { Email } from "../../../../../src/domain/value-objects/Email.js";
import { FakeUserRepository } from "../../../_fakes/FakeUserRepository.js";
import { FakePasswordHasher } from "../../../_fakes/FakePasswordHasher.js";
import { FakeTokenService } from "../../../_fakes/FakeTokenService.js";

describe("LoginUserUseCase", () => {
  let userRepository: FakeUserRepository;
  let useCase: LoginUserUseCase;

  beforeEach(async () => {
    userRepository = new FakeUserRepository();
    useCase = new LoginUserUseCase(userRepository, new FakePasswordHasher(), new FakeTokenService());

    await userRepository.save(
      User.create({
        id: "user-1",
        name: "Ada",
        email: Email.create("ada@example.com"),
        passwordHash: "hashed:password123",
        role: "user",
        createdAt: new Date(),
      }),
    );
  });

  it("returns a token and the user on valid credentials", async () => {
    const output = await useCase.execute({ email: "ada@example.com", password: "password123" });

    expect(output.token).toBe("token:user-1:user");
    expect(output.user).toEqual({ id: "user-1", name: "Ada", email: "ada@example.com", role: "user" });
  });

  it("rejects an unknown email", async () => {
    await expect(useCase.execute({ email: "nobody@example.com", password: "password123" })).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it("rejects a wrong password", async () => {
    await expect(useCase.execute({ email: "ada@example.com", password: "wrong" })).rejects.toThrow(
      InvalidCredentialsError,
    );
  });
});
