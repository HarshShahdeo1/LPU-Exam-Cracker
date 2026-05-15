from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=11)

text = """CSV207: AGILE PRACTICES

Course Outcomes:
CO1: Understand principles and methodologies associated with digital transformation.
CO2: Differentiate between design thinking, agile, and lean methodologies.
CO3: Study agile estimation and planning methodologies to enhance project management.
CO4: Apply extreme programming (XP) principles and practices in software development.
CO5: Understand the concept of agile planning and its significance.
CO6: Apply kanban principles to optimize workflow.

Unit I: Introduction to Digital Transformation
Introduction, Challenges of Traditional Business Model, Why Digital Transformation, Design Thinking, Different Phases of Design Thinking, Divergence, Emergence and Convergence of Design Thinking, Design Thinking vs Agile vs Lean, Agile Practices, Design Sprint and its Phases.

Unit II: Product Management
Introduction to Product Management & Service Mindset, Product Manager, Building Products and services, Product lifecycle and phases, product development & Methodology, systems thinking, value chain, Introduction of Capability Optimization and Capability Maturity Model, Business Integration methods, Agile methodology, Product Marketing, User Experience Design.

Unit III: Agile & Scrum Methodology
Agile development, Agile Methodologies, Introduction and history of Lean, Lean principles, Scrum, Scrum Theory, Scrum Values, Scrum Roles, Scrum Development Team, Scrum Master Scrum Sprints, Scrum Ceremonies or Events, Artifacts.

Unit IV: Backlog
Product Backlog, Sprint Backlog, Increment, Benefits of Scrum, Extreme Programming, Introduction-XP Values, XP Rules, XP Roles, XP Activities, Different Categories of XP Practices.

Unit V: Agile Implementation
Agile Estimation and Planning, Agile Planning and its Need, The Agile Planning Onion, Levels of Agile Planning, Conditions of Satisfaction, Estimating the Size in Story Points and Ideal Days, Agile Estimating Techniques, Implementing Agile on Industry Projects, Soft Skills in Agile.

Unit VI: Kanban Principles
Kanban Principle, Kanban Board, Kanban Core Practices, Make work visible, Limit work in progress (WiP), Manage flow, Make progress policies explicit, Implement feedback mechanisms, Improve collaboratively.
"""

for line in text.split('\n'):
    pdf.multi_cell(0, 7, line)

pdf.output("public/sample-syllabus.pdf")
print("Python generated PDF successfully!")
