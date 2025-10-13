/**
 * @jest-environment jsdom
 */

// --- MOCK JQUERY ---
jest.mock('jquery', () => {
  const m$ = jest.fn(() => m$)
  m$.modal = jest.fn()
  m$.find = jest.fn(() => m$)
  m$.html = jest.fn(() => m$)
  m$.width = jest.fn(() => 100)
  m$.click = jest.fn(() => m$)
  return m$
})
global.$ = jest.requireMock('jquery')

// --- IMPORTS ---
import { screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"

import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"
import Bills from "../containers/Bills.js"
import store from "../__mocks__/store.js"

// --- TESTS ---
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe("Given I am on Bills page and the page is loaded", () => {
  let billsInstance
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

    document.body.innerHTML = BillsUI({ data: bills })
    billsInstance = new Bills({
      document,
      onNavigate: jest.fn(),
      store,
      localStorage: window.localStorage
    })
  })

  test("When I click on 'New Bill' button, Then handleClickNewBill should navigate to NewBill", () => {
    const handleClickNewBillSpy = jest.fn(billsInstance.handleClickNewBill)
    const buttonNewBill = screen.getByTestId('btn-new-bill')
    buttonNewBill.addEventListener('click', handleClickNewBillSpy)
    userEvent.click(buttonNewBill)

    expect(handleClickNewBillSpy).toHaveBeenCalled()
    expect(billsInstance.onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
  })

  test("When I click on eye icon, Then a modal should open with the bill image", () => {
    const iconEye = screen.getAllByTestId('icon-eye')[0]
    const handleClickIconEyeSpy = jest.fn(() => billsInstance.handleClickIconEye(iconEye))
    iconEye.addEventListener('click', handleClickIconEyeSpy)
    userEvent.click(iconEye)

    expect(handleClickIconEyeSpy).toHaveBeenCalled()
  })

  test("When I fetch bills from mock API GET, Then it should return bills in correct format", async () => {
    const billsList = await billsInstance.getBills()
    expect(Array.isArray(billsList)).toBe(true)
    expect(billsList.length).toBeGreaterThan(0)
    expect(billsList[0].date).toMatch(/\d{1,2} [A-Za-zéû.]+ \d{2,4}/)
    expect(['En attente', 'Accepté', 'Refusé']).toContain(billsList[0].status)
  })
})

test("When formatDate throws an error, Then it should return unformatted date", async () => {
  const corruptedStore = {
    bills: () => ({
      list: () => Promise.resolve([{ date: "bad-date", status: "pending" }])
    })
  }

  const billsInstance = new Bills({
    document,
    onNavigate: jest.fn(),
    store: corruptedStore,
    localStorage: window.localStorage
  })

  const billsList = await billsInstance.getBills()
  expect(billsList[0].date).toBe("bad-date")
})

