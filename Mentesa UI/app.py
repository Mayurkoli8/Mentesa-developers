from flask import Flask, render_template, request, redirect, url_for, flash
import smtplib

app = Flask(__name__)
app.secret_key = "secret_key_here"  # Needed for flash messages

# Home route
@app.route('/')
def home():
    return render_template('index.html')  # Your HTML file

# Contact form submission route
@app.route('/contact', methods=['POST'])
def contact():
    name = request.form.get('name')
    email = request.form.get('email')
    message = request.form.get('message')

    if not name or not email or not message:
        flash("All fields are required!", "error")
        return redirect(url_for('home'))

    # Example: Sending email (SMTP) - optional
    try:
        sender_email = "your_email@gmail.com"
        receiver_email = "your_email@gmail.com"  # or team email
        password = "your_email_password"

        subject = f"New Contact Form Submission from {name}"
        body = f"Name: {name}\nEmail: {email}\nMessage:\n{message}"
        email_message = f"Subject: {subject}\n\n{body}"

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, email_message)
        server.quit()

        flash("Message sent successfully!", "success")
    except Exception as e:
        flash(f"Error sending message: {str(e)}", "error")

    return redirect(url_for('home'))

if __name__ == "__main__":
    app.run(debug=True)
