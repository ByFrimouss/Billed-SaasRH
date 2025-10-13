import { ROUTES_PATH } from '../constants/routes.js' 
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    this.localStorage = localStorage
    this.fileUrl = null
    this.fileName = null
    this.billId = null

    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    
    const fileInput = this.document.querySelector(`input[data-testid="file"]`)
    fileInput.addEventListener("change", this.handleChangeFile)

    new Logout({ document, localStorage, onNavigate })
  }

  handleChangeFile = e => {
    e.preventDefault()
    const fileInput = this.document.querySelector(`input[data-testid="file"]`)
    const file = fileInput.files[0]
    const filePath = file ? file.name.split(/\\/g) : ""
    const fileName = filePath[filePath.length - 1] || ""

    const allowedExtensions = ['jpg', 'jpeg', 'png']
    const fileExtension = fileName.split('.').pop().toLowerCase()

    const errorElement = this.document.querySelector('[data-testid="file-error"]')

    if (!allowedExtensions.includes(fileExtension)) {
      fileInput.value = ""
      if (errorElement) errorElement.textContent = "Format du fichier non valide"
      return
    }

    if (errorElement) errorElement.textContent = "" // efface le message si fichier valide

    this.fileName = fileName
    this.file = file

    const formData = new FormData()
    const email = JSON.parse(this.localStorage.getItem("user")).email
    formData.append('file', file)
    formData.append('email', email)

    if (this.store) {
      this.store
        .bills()
        .create({
          data: formData,
          headers: { noContentType: true },
        })
        .then(({ fileUrl, key }) => {
          this.billId = key
          this.fileUrl = fileUrl
          this.fileName = fileName
        })
        .catch(error => console.error(error))
    }
  }

  handleSubmit = e => {
    e.preventDefault()
    const email = JSON.parse(this.localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill)
  }

  updateBill = (bill) => {
    if (this.store) {
      return this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills'])
        })
        .catch(error => {
          console.error(error)
          throw error
        })
    }
  }
}
