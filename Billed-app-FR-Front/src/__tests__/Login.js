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
    document.body.innerHTML = LoginUI();

    // Mock localStorage proprement
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

  describe("When I do not fill fields and I click on employee button Login In", () => {
    test("Then it should render Login page", () => {
      const form = screen.getByTestId("form-employee");
      fireEvent.submit(form);
      expect(screen.getByTestId("form-employee")).toBeTruthy();
    });
  });

  describe("When I fill fields in correct format and I click on employee button Login In", () => {
    test("Then I should be identified as an Employee in app", async () => {
      const inputData = { email: "johndoe@email.com", password: "azerty" };

      fireEvent.change(screen.getByTestId("employee-email-input"), {
        target: { value: inputData.email },
      });
      fireEvent.change(screen.getByTestId("employee-password-input"), {
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

      const form = screen.getByTestId("form-employee");
      fireEvent.submit(form);

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

      // Vérifie qu'on navigue vers la page Bills
      expect(screen.queryByText("Mes notes de frais")).toBeTruthy();
    });
  });

  describe("When I fill fields in correct format and I click on admin button Login In", () => {
    test("Then I should be identified as an HR admin in app", async () => {
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

      await waitFor(() => {
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
          "user",
          JSON.stringify(inputData)
        );
      });

      // Vérifie qu'on navigue vers la page Dashboard
      expect(screen.queryByText("Validations")).toBeTruthy();
    });
  });
});
