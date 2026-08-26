import type { Request, Response } from "express";
import type { LoginUserUseCase } from "../../../../application/use-cases/auth/LoginUserUseCase.js";
import type { RegisterUserUseCase } from "../../../../application/use-cases/auth/RegisterUserUseCase.js";

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const output = await this.registerUserUseCase.execute(req.body);
    res.status(201).json(output);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const output = await this.loginUserUseCase.execute(req.body);
    res.status(200).json(output);
  };
}
