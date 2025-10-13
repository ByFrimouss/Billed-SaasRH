/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";
import { ROUTES } from "../constants/routes.js";
import store from "../__mocks__/store";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an Employee on NewBill Page", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({ type: "Employee", email: "a@a" })
    );
    document.body.innerHTML = NewBillUI();
  });

  test("Then I can upload a valid image file", async () => {
    const newBill = new NewBill({ document, onNavigate: jest.fn(), store, localStorage: window.localStorage });
    const file = new File(["image"], "image.png", { type: "image/png" });

    const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
    const input = screen.getByTestId("file");
    input.addEventListener("change", handleChangeFile);
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleChangeFile).toHaveBeenCalled();
    expect(input.files[0].name).toBe("image.png");
  });

  test("Then uploading an invalid file format should show an error", async () => {
    const newBill = new NewBill({ document, onNavigate: jest.fn(), store, localStorage: window.localStorage });
    const file = new File(["document"], "document.pdf", { type: "application/pdf" });

    const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
    const input = screen.getByTestId("file");
    input.addEventListener("change", handleChangeFile);
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleChangeFile).toHaveBeenCalled();
    expect(screen.getByText("Format du fichier non valide")).toBeTruthy();
  });

 test("Then submitting a valid form should call updateBill and navigate to Bills page", async () => {
  const onNavigate = jest.fn();
  const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

  // Spy sur updateBill pour qu'elle appelle directement onNavigate
  jest.spyOn(newBill, "updateBill").mockImplementation((bill) => {
    onNavigate(ROUTES["Bills"]);
  });

  // Récupération du formulaire
  const form = screen.getByTestId("form-new-bill");

  // Remplissage des champs obligatoires
  fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Test bill" } });
  fireEvent.change(screen.getByTestId("amount"), { target: { value: "100" } });
  fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-09-01" } });
  fireEvent.change(screen.getByTestId("pct"), { target: { value: "10" } });
  fireEvent.change(screen.getByTestId("file"), {
    target: { files: [new File(["image"], "image.jpg", { type: "image/jpg" })] },
  });

  // Soumission du formulaire
  fireEvent.submit(form);

  // Vérifications
  expect(newBill.updateBill).toHaveBeenCalled();
  expect(onNavigate).toHaveBeenCalledWith(ROUTES["Bills"]);
});



  test("Then it should handle 404 error from API", async () => {
    jest.spyOn(mockStore, "bills").mockImplementationOnce(() => ({
      update: () => Promise.reject(new Error("Erreur 404")),
    }));
    const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
    await expect(newBill.updateBill({})).rejects.toThrow("Erreur 404");
  });
});
