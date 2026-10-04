"use client"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { DialogPanel } from "@/components/dialog-parts"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Login03Icon, UserAdd01Icon, UserGroupIcon, UserIcon } from "@hugeicons/core-free-icons"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { useState } from "react"
import { useToast } from "@/helpers/ToastProvider"
import { useFormErrors } from "@/helpers/useFormErrors"
import { ROLES, useAuth } from "@/api/context/AuthContext"
import {
  EMAIL_TAKEN_MSG,
  INVALID_CREDENTIALS_MSG,
  LOGGED_IN_MSG,
  REGISTERED_MSG,
} from "@/helpers/Errors"

const EMPTY_LOGIN = {
  email: "",
  password: "",
}

const ACCOUNT_TYPES = [
  { value: "CITIZEN", label: "Mieszkaniec", hint: "Konto osoby prywatnej", icon: UserIcon },
  { value: "NGO", label: "Organizacja pozarządowa", hint: "Fundacja, stowarzyszenie, KGW – wymagany NIP", icon: UserGroupIcon },
]

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7]

function nipError(raw) {
  const digits = raw.replace(/[\s-]/g, "")
  if (!/^\d{10}$/.test(digits)) return "NIP musi mieć 10 cyfr, np. 123-456-32-18"
  const sum = NIP_WEIGHTS.reduce((acc, w, i) => acc + w * Number(digits[i]), 0) % 11
  if (sum === 10 || sum !== Number(digits[9])) return "Niepoprawny NIP – sprawdź cyfry"
  return null
}

const EMPTY_REGISTER = {
  accountType: "CITIZEN",
  nip: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LinkButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer font-semibold text-primary underline underline-offset-4 hover:no-underline">
      {children}
    </button>
  )
}

export function LoginForm({
  className,
  initialMode = "login",
  onSuccess,
  onClose,
  headingLevel = 2,
  ...props
}) {
  const { showToast } = useToast();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode !== "register");
  const [loginData, setLoginData] = useState(EMPTY_LOGIN);
  const [registerData, setRegisterData] = useState(EMPTY_REGISTER);
  const [loading, setLoading] = useState(false);
  const loginErrors = useFormErrors("login");
  const registerErrors = useFormErrors("register");
  const Heading = `h${headingLevel}`;

  const updateLogin = (field) => (e) => {
    setLoginData((prev) => ({ ...prev, [field]: e.target.value }));
    loginErrors.clear(field);
  };

  const updateRegister = (field) => (e) => {
    setRegisterData((prev) => ({ ...prev, [field]: e.target.value }));
    registerErrors.clear(field);
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    loginErrors.reset();
    registerErrors.reset();
    requestAnimationFrame(() => document.getElementById("auth-heading")?.focus());
  };

  const validateLogin = () => {
    const { email, password } = loginData;

    if (!email.trim()) return ["email", "Podaj adres email"];
    if (!EMAIL_REGEX.test(email.trim())) return ["email", "Niepoprawny adres email, np. jan@example.com"];
    if (!password) return ["password", "Podaj hasło"];
    return null;
  };

  const validateRegister = () => {
    const { name, email, password, confirmPassword, accountType, nip } = registerData;
    const ngo = accountType === "NGO";

    if (!name.trim()) return ["name", ngo ? "Podaj nazwę organizacji" : "Podaj imię i nazwisko"];
    if (ngo && nipError(nip)) return ["nip", nipError(nip)];
    if (!email.trim()) return ["email", "Podaj adres email"];
    if (!EMAIL_REGEX.test(email.trim())) return ["email", "Niepoprawny adres email, np. jan@example.com"];
    if (password.length < 8) return ["password", "Hasło musi mieć co najmniej 8 znaków"];
    if (password !== confirmPassword) return ["confirmPassword", "Hasła nie są takie same"];
    return null;
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    const error = validateLogin();
    if (error) {
      loginErrors.fail(...error);
      return;
    }

    setLoading(true);
    try {
      await login({ email: loginData.email.trim(), password: loginData.password });
      showToast(LOGGED_IN_MSG, "success");
      setLoginData(EMPTY_LOGIN);
      onSuccess?.();
    } catch (err) {
      if (err?.status === 401) loginErrors.fail("password", INVALID_CREDENTIALS_MSG);
      else showToast(null, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    const error = validateRegister();
    if (error) {
      registerErrors.fail(...error);
      return;
    }

    setLoading(true);
    try {
      await register({
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        role: registerData.accountType === "NGO" ? ROLES.NGO : ROLES.CITIZEN,
        nip: registerData.accountType === "NGO" ? registerData.nip.replace(/[\s-]/g, "") : null,
      });
      showToast(REGISTERED_MSG, "success");
      setRegisterData(EMPTY_REGISTER);
      onSuccess?.();
    } catch (err) {
      if (err?.status === 409) registerErrors.fail("email", EMAIL_TAKEN_MSG);
      else if (err?.status === 400 && err.body?.message?.includes("NIP")) registerErrors.fail("nip", err.body.message);
      else showToast(null, "error");
    } finally {
      setLoading(false);
    }
  };

  const isNgo = registerData.accountType === "NGO";

  return (
    <DialogPanel className={className} {...props}>
      <div className="flex shrink-0 flex-col gap-5 px-6 pt-6">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground shadow-elevation-1">H</span>
          <div className="min-w-0 flex-1">
            <Heading id="auth-heading" tabIndex={-1} className="font-heading text-xl font-bold tracking-tight outline-none">
              {isLogin ? "Zaloguj się" : "Utwórz konto"}
            </Heading>
            <p id="auth-description" className="mt-1 text-sm text-muted-foreground">
              {isLogin
                ? "Witaj ponownie w Małopolskim Hubie Innowacji."
                : "Konto mieszkańca albo organizacji pozarządowej. Konta samorządów i ROPS zakłada administrator."}
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="-mt-1 -mr-2 shrink-0" onClick={onClose} aria-label="Zamknij okno">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-5" />
            </Button>
          )}
        </div>
        <div role="group" aria-label="Rodzaj formularza" className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          {[
            { login: true, label: "Logowanie", icon: Login03Icon },
            { login: false, label: "Rejestracja", icon: UserAdd01Icon },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              aria-pressed={isLogin === tab.login}
              onClick={() => isLogin !== tab.login && switchMode(tab.login)}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors",
                isLogin === tab.login ? "bg-card text-foreground shadow-elevation-1 dark:bg-secondary dark:text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HugeiconsIcon icon={tab.icon} strokeWidth={2} aria-hidden="true" className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-6">
        {isLogin ? (
          <form onSubmit={submitLogin} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <Input
                  {...loginErrors.fieldProps("email")}
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="np. jan@example.com"
                  value={loginData.email}
                  onChange={updateLogin("email")}
                />
                <FieldError {...loginErrors.errorProps("email")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="login-password">Hasło</FieldLabel>
                <PasswordInput
                  {...loginErrors.fieldProps("password")}
                  autoComplete="current-password"
                  required
                  value={loginData.password}
                  onChange={updateLogin("password")}
                />
                <FieldError {...loginErrors.errorProps("password")} />
              </Field>
              <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
                {loading ? "Logowanie..." : "Zaloguj się"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Nie masz konta? <LinkButton onClick={() => switchMode(false)}>Zarejestruj się</LinkButton>
              </p>
            </FieldGroup>
          </form>
        ) : (
          <form onSubmit={submitRegister} noValidate>
            <FieldGroup>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium">Typ konta</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ACCOUNT_TYPES.map((type) => {
                    const checked = registerData.accountType === type.value
                    return (
                      <label
                        key={type.value}
                        className={cn(
                          "relative flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]",
                          checked ? "border-primary bg-secondary/60 dark:bg-secondary/40" : "border-outline hover:bg-muted/60"
                        )}
                      >
                        <input
                          type="radio"
                          name="register-account-type"
                          value={type.value}
                          checked={checked}
                          onChange={updateRegister("accountType")}
                          className="absolute top-4 right-4 size-4 accent-[var(--primary)]"
                        />
                        <HugeiconsIcon icon={type.icon} strokeWidth={1.8} aria-hidden="true" className={cn("size-6", checked ? "text-primary" : "text-muted-foreground")} />
                        <span>
                          <span className="block text-sm font-semibold">{type.label}</span>
                          <span className="block text-xs text-muted-foreground">{type.hint}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
              <Field>
                <FieldLabel htmlFor="register-name">{isNgo ? "Nazwa organizacji" : "Imię i nazwisko"}</FieldLabel>
                <Input
                  {...registerErrors.fieldProps("name")}
                  type="text"
                  required
                  autoComplete={isNgo ? "organization" : "name"}
                  placeholder={isNgo ? "np. Fundacja Dobre Sąsiedztwo" : "np. Jan Kowalski"}
                  value={registerData.name}
                  onChange={updateRegister("name")}
                />
                <FieldError {...registerErrors.errorProps("name")} />
              </Field>
              {isNgo && (
                <Field>
                  <FieldLabel htmlFor="register-nip">NIP organizacji</FieldLabel>
                  <Input
                    {...registerErrors.fieldProps("nip", "register-nip-hint")}
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={13}
                    placeholder="np. 1234563218"
                    value={registerData.nip}
                    onChange={updateRegister("nip")}
                  />
                  <FieldDescription id="register-nip-hint">10 cyfr, możesz wpisać z myślnikami.</FieldDescription>
                  <FieldError {...registerErrors.errorProps("nip")} />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="register-email">Email</FieldLabel>
                <Input
                  {...registerErrors.fieldProps("email")}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="np. jan@example.com"
                  value={registerData.email}
                  onChange={updateRegister("email")}
                />
                <FieldError {...registerErrors.errorProps("email")} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="register-password">Hasło</FieldLabel>
                  <PasswordInput
                    {...registerErrors.fieldProps("password", "register-password-hint")}
                    required
                    autoComplete="new-password"
                    value={registerData.password}
                    onChange={updateRegister("password")}
                  />
                  <FieldDescription id="register-password-hint">Co najmniej 8 znaków.</FieldDescription>
                  <FieldError {...registerErrors.errorProps("password")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="register-confirmPassword">Powtórz hasło</FieldLabel>
                  <PasswordInput
                    {...registerErrors.fieldProps("confirmPassword")}
                    required
                    autoComplete="new-password"
                    value={registerData.confirmPassword}
                    onChange={updateRegister("confirmPassword")}
                  />
                  <FieldError {...registerErrors.errorProps("confirmPassword")} />
                </Field>
              </div>
              <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
                {loading ? "Tworzenie konta..." : "Utwórz konto"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Masz już konto? <LinkButton onClick={() => switchMode(true)}>Zaloguj się</LinkButton>
              </p>
            </FieldGroup>
          </form>
        )}
      </div>
    </DialogPanel>
  )
}
