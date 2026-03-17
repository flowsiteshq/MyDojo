from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        # Logo
        # self.image('logo.png', 10, 8, 33)
        # Arial bold 15
        self.set_font('Arial', 'B', 24)
        # Move to the right
        self.cell(80)
        # Title
        self.cell(30, 10, 'MyDojo Class Schedule', 0, 0, 'C')
        # Line break
        self.ln(20)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        # Arial italic 8
        self.set_font('Arial', 'I', 8)
        # Page number
        self.cell(0, 10, 'Page ' + str(self.page_no()) + '/{nb}', 0, 0, 'C')

# Instantiation of inherited class
pdf = PDF(orientation='L') # Landscape for better table fit
pdf.alias_nb_pages()
pdf.add_page()
pdf.set_font('Arial', '', 12)

# Column widths
w = [40, 35, 35, 35, 35, 35, 35]
header = ['Program', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
data = [
    ["Little Ninjas", "5:30PM", "12 NOON", "5:30PM", "12 NOON", "N/A", "11AM"],
    ["Adv. Core Kids", "4PM", "6PM", "4PM", "6PM", "6PM", "11:30AM"],
    ["Beg. Core Kids", "6PM", "4PM", "6PM", "4PM", "6PM", "11:30AM"],
    ["Adults", "7PM", "7PM", "7PM", "7PM", "6PM", "11AM"],
    ["Kickboxing", "8PM", "8PM", "8PM", "8PM", "N/A", "12PM"],
    ["Kickboxing (Late)", "9PM", "9PM", "9PM", "9PM", "N/A", "N/A"],
]

# Header
pdf.set_fill_color(0, 0, 0)
pdf.set_text_color(255, 255, 255)
pdf.set_font('Arial', 'B', 12)
for i in range(len(header)):
    pdf.cell(w[i], 10, header[i], 1, 0, 'C', True)
pdf.ln()

# Data
pdf.set_fill_color(240, 240, 240)
pdf.set_text_color(0, 0, 0)
pdf.set_font('Arial', '', 11)
fill = False
for row in data:
    pdf.cell(w[0], 10, row[0], 1, 0, 'L', fill)
    for i in range(1, len(row)):
        pdf.cell(w[i], 10, row[i], 1, 0, 'C', fill)
    pdf.ln()
    fill = not fill

# Footer text
pdf.ln(10)
pdf.set_font('Arial', 'I', 10)
pdf.cell(0, 10, '*Class schedules are subject to change. Updated October 2022', 0, 1, 'C')
pdf.cell(0, 10, 'MyDojo Martial Arts & Fitness - (877) 4-MYDOJO - 11721 Spring Cypress Rd, Tomball, TX 77377', 0, 1, 'C')

pdf.output('/home/ubuntu/mydojo-website/client/public/MyDojo_Schedule.pdf', 'F')
