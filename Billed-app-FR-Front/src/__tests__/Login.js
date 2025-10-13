/**
 * @jest-environment jsdom
 */
import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES } from "../constants/routes";
import { fireEvent, screen, waitFor } from "@testing-library/dom";

describe("Given that I am a user on login page", () => {
  let localStorageMock;

  beforeEach(() => {
    // On injecte le HTML de la page login
    document.body.innerHTML = LoginUI();

    // Mock du localStorage
    localStorageMock = (() => {
      let store = {};
      return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value }),
        clear: jest.fn(() => { store = {} }),
      };
    })();
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
  });

  // Test 1 : Formulaire employé soumis vide
  describe("When I do not fill fields and I click on employee login button", () => {
    test("Then it should render Login page (reste sur la page)", () => {
      const form = screen.getByTestId("form-employee");
      fireEvent.submit(form);
      expect(screen.getByTestId("form-employee")).toBeTruthy();
    });
  });

  // Test 2 : Employé connecté correctement
  describe("When I fill fields correctly and I click on employee login button", () => {
    test("Then I should be identified as an Employee and redirected to Bills page", async () => {
      const inputData = { email: "johndoe@email.com", password: "azerty" };

      // Remplissage des champs
      fireEvent.change(screen.getByTestId("employee-email-input"), {
        target: { value: inputData.email },
      });
      fireEvent.change(screen.getByTestId("employee-password-input"), {
        target: { value: inputData.password },
      });

      // Mock de la navigation
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Mock du store pour login
      const store = {
        login: jest.fn().mockResolvedValue({ jwt: "fake-jwt" }),
        users: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({}),
        })),
      };

      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });

      const form = screen.getByTestId("form-employee");
      fireEvent.submit(form);

      // On attend que localStorage soit mis à jour
      await waitFor(() => {
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
          "user",
          JSON.stringify({
            type: "Employee",
            email: inputData.email,
            password: inputData.password,
            status: "connected",
          })
        );
      });

      // On attend la redirection vers la page Bills
      await waitFor(() => {
        expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      });
    });
  });

  // Test 3 : Admin connecté correctement
  describe("When I fill fields correctly and I click on admin login button", () => {
    test("Then I should be identified as HR Admin and redirected to Dashboard", async () => {
      const inputData = {
        type: "Admin",
        email: "johndoe@email.com",
        password: "azerty",
        status: "connected",
      };

      fireEvent.change(screen.getByTestId("admin-email-input"), {
        target: { value: inputData.email },
      });
      fireEvent.change(screen.getByTestId("admin-password-input"), {
        target: { value: inputData.password },
      });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const store = {
        login: jest.fn().mockResolvedValue({ jwt: "fake-jwt" }),
        users: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({}),
        })),
      };

      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });

      const form = screen.getByTestId("form-admin");
      fireEvent.submit(form);

      // Vérifie que localStorage est bien mis à jour
      await waitFor(() => {
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
          "user",
          JSON.stringify(inputData)
        );
      });

      // Vérifie la redirection vers Dashboard
      await waitFor(() => {
        expect(screen.getByText("Validations")).toBeTruthy();
      });
    });
  });
});
