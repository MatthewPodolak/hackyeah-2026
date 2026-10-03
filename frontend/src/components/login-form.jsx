"use client"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useToast } from "@/helpers/ToastProvider"
import { ROLES, ROLE_LABELS, useAuth } from "@/api/context/AuthContext"
import {
  EMAIL_TAKEN_MSG,
  INVALID_CREDENTIALS_MSG,
  LOGGED_IN_MSG,
  REGISTERED_MSG,
} from "@/helpers/Errors"

const USER_TYPES = [
  { value: ROLES.CITIZEN, label: ROLE_LABELS.CITIZEN, short: "O", hint: "Mieszkaniec" },
  { value: ROLES.JST, label: ROLE_LABELS.JST, short: "J", hint: "Samorząd" },
  { value: ROLES.ROPS, label: ROLE_LABELS.ROPS, short: "R", hint: "Pomoc społeczna" },
]

const EMPTY_LOGIN = {
  email: "",
  password: "",
}

const EMPTY_REGISTER = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function errorMessage(error) {
  if (error?.status === 401) return INVALID_CREDENTIALS_MSG
  if (error?.status === 409) return EMAIL_TAKEN_MSG
  return null
}

export function LoginForm({
  className,
  initialMode = "login",
  onSuccess,
  ...props
}) {
  const { showToast } = useToast();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode !== "register");
  const [selectedUserType, setSelectedUserType] = useState(ROLES.CITIZEN);
  const [loginData, setLoginData] = useState(EMPTY_LOGIN);
  const [registerData, setRegisterData] = useState(EMPTY_REGISTER);
  const [loading, setLoading] = useState(false);

  const updateLogin = (field) => (e) =>
    setLoginData((prev) => ({ ...prev, [field]: e.target.value }));

  const updateRegister = (field) => (e) =>
    setRegisterData((prev) => ({ ...prev, [field]: e.target.value }));

  const validateLogin = () => {
    const { email, password } = loginData;

    if (!email.trim() || !password) {
      return "Proszę wypełnij wszystkie pola";
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return "Niepoprawny adres email";
    }
    return null;
  };

  const validateRegister = () => {
    const { name, email, password, confirmPassword } = registerData;

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      return "Proszę wypełnij wszystkie pola";
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return "Niepoprawny adres email";
    }
    if (password.length < 8) {
      return "Hasło musi mieć co najmniej 8 znaków";
    }
    if (password !== confirmPassword) {
      return "Hasła nie są takie same";
    }
    if (!USER_TYPES.some((t) => t.value === selectedUserType)) {
      return "Wybierz typ konta";
    }
    return null;
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    const error = validateLogin();
    if (error) {
      showToast(error, "error");
      return;
    }

    setLoading(true);
    try {
      await login({ email: loginData.email.trim(), password: loginData.password });
      showToast(LOGGED_IN_MSG, "success");
      setLoginData(EMPTY_LOGIN);
      onSuccess?.();
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    const error = validateRegister();
    if (error) {
      showToast(error, "error");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        role: selectedUserType,
      });
      showToast(REGISTERED_MSG, "success");
      setRegisterData(EMPTY_REGISTER);
      onSuccess?.();
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        {isLogin ? (
          <>
            <CardHeader>
              <CardTitle>Zaloguj się</CardTitle>
              <CardDescription>
                Podaj email i hasło, aby zalogować się do konta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitLogin} noValidate>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="m@example.com"
                      value={loginData.email}
                      onChange={updateLogin("email")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Hasło</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={loginData.password}
                      onChange={updateLogin("password")}
                    />
                  </Field>
                  <Field>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Logowanie..." : "Zaloguj"}
                    </Button>
                    <FieldDescription className="text-center">
                      Nie masz konta? <a className="cursor-pointer" onClick={() => setIsLogin(false)}>Zarejestruj się</a>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </>
        ):(
          <>
            <CardHeader>
              <CardTitle>Utwórz konto</CardTitle>
              <CardDescription>
                Wybierz typ konta i uzupełnij dane
              </CardDescription>
            </CardHeader>
            <CardContent>

              <div className="w-full flex items-center justify-center py-3 flex-row gap-3 min-h-16">
                {USER_TYPES.map((type) => {
                  const selected = selectedUserType === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedUserType(type.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 cursor-pointer rounded-lg border-2 px-4 py-3 min-w-24 transition-colors",
                        selected
                          ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-colors",
                          selected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-neutral-300 dark:border-neutral-700"
                        )}
                      >
                        {type.short}
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="text-sm font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.hint}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <form onSubmit={submitRegister} noValidate>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">
                      {selectedUserType === ROLES.CITIZEN ? "Imię i nazwisko" : "Nazwa instytucji"}
                    </FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      autoComplete={selectedUserType === ROLES.CITIZEN ? "name" : "organization"}
                      placeholder={selectedUserType === ROLES.CITIZEN ? "Jan Kowalski" : "Urząd Miasta Krakowa"}
                      value={registerData.name}
                      onChange={updateRegister("name")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="register-email">Email</FieldLabel>
                    <Input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      placeholder="m@example.com"
                      value={registerData.email}
                      onChange={updateRegister("email")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="register-password">Hasło</FieldLabel>
                    <Input
                      id="register-password"
                      type="password"
                      autoComplete="new-password"
                      value={registerData.password}
                      onChange={updateRegister("password")}
                    />
                    <FieldDescription>Co najmniej 8 znaków.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">Powtórz hasło</FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={registerData.confirmPassword}
                      onChange={updateRegister("confirmPassword")}
                    />
                  </Field>
                  <Field>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Tworzenie konta..." : "Utwórz konto"}
                    </Button>
                    <FieldDescription className="text-center">
                      Masz już konto?{" "}
                      <a className="cursor-pointer" onClick={() => setIsLogin(true)}>
                        Zaloguj się
                      </a>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
