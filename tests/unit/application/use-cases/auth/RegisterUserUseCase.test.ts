import { beforeEach, describe, expect, it } from "vitest";
import { RegisterUserUseCase } from "../../../../../src/application/use-cases/auth/RegisterUserUseCase.js";
import { UserAlreadyExistsError } from "../../../../../src/domain/errors/UserAlreadyExistsError.js";
import { InvalidEmailError } from "../../../../../src/domain/errors/InvalidEmailError.js";
import { FakeUserRepository } from "../../../_fakes/FakeUserRepository.js";
import { FakePasswordHasher } from "../../../_fakes/FakePasswordHasher.js";
import { SequentialIdGenerator } from "../../../_fakes/SequentialIdGenerator.js";
import { FixedClock } from "../../../_fakes/FixedClock.js";

describe("RegisterUserUseCase", () => {
  let userRepository: FakeUserRepository;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    useCase = new RegisterUserUseCase(
      userRepository,
      new FakePasswordHasher(),
      new SequentialIdGenerator(),
      new FixedClock(new Date("2026-01-01T00:00:00Z")),
    );
  });

  it("registers a new user with the default 'user' role", async () => {
    const output = await useCase.execute({ name: "Ada", email: "ada@example.com", password: "password123" });

    expect(output).toEqual({ id: "id-1", name: "Ada", email: "ada@example.com", role: "user" });
  });

  it("persists the user with a hashed password", async () => {
    await useCase.execute({ name: "Ada", email: "ada@example.com", password: "password123" });

    const stored = await userRepository.findByEmail("ada@example.com");
    expect(stored?.passwordHash).toBe("hashed:password123");
  });

  it("rejects duplicate emails", async () => {
    await useCase.execute({ name: "Ada", email: "ada@example.com", password: "password123" });

    await expect(
      useCase.execute({ name: "Ada 2", email: "ada@example.com", password: "password456" }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });

  it("rejects invalid emails", async () => {
    await expect(
      useCase.execute({ name: "Ada", email: "not-an-email", password: "password123" }),
    ).rejects.toThrow(InvalidEmailError);
  });
});
