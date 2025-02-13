
# PulseCare
[![license](https://img.shields.io/badge/License-MIT-green)](https://github.com/MatinGhanbari/PulseCare/raw/refs/heads/main/LICENSE)
[![django ci](https://github.com/MatinGhanbari/PulseCare/actions/workflows/django.yml/badge.svg)](https://github.com/MatinGhanbari/PulseCare/actions/workflows/django.yml)

In the current era, with the increasing prevalence of cardiovascular diseases and the need for effective management of health data such as electrocardiograms (ECGs), the design and implementation of monitoring and analytical systems have emerged as key solutions in the field of digital health. This thesis focuses on the design and implementation of a web-based dashboard for cardiac patients, aiming to provide a practical and comprehensive tool for monitoring, analyzing, and displaying patient health data. The project leverages modern web technologies and advanced architectures to enable the collection, processing, and visualization of cardiac patient data through interactive charts, tables, and reports. Additionally, by analyzing patient data, the system facilitates the detection of abnormal patterns for both physicians and patients. The dashboard is implemented using technologies such as the Python programming language and the Django framework. This project represents a significant step toward improving the management of cardiovascular diseases and enhancing the quality of healthcare through digital technologies. It can serve as a foundation for the development of similar systems in the future.

## Features

- **Real-Time ECG Monitoring**: The system provides real-time monitoring of electrocardiogram (ECG) data, allowing healthcare professionals to track patients' heart activity instantly.

- **Interactive Data Visualization**: The dashboard offers interactive charts, graphs, and tables to display ECG data and other health metrics in a user-friendly and visually appealing manner.

- **Abnormal Pattern Detection**: Advanced algorithms analyze ECG signals to detect abnormal patterns, such as arrhythmias, and generate automatic alerts for physicians and patients.

- **Patient Management**: A comprehensive patient management system allows healthcare providers to add, edit, and monitor patient information efficiently.

- **User Authentication and Authorization**: Secure user authentication using JWT (JSON Web Tokens) ensures that only authorized personnel can access sensitive patient data.

- **Data Processing with Python**: The backend is powered by Python, utilizing libraries like NumPy and WFDB for efficient processing and analysis of ECG signals.

- **Web Framework (Django)**: Built on the Django framework, the system ensures robust, scalable, and maintainable web application development.

- **Database Integration**: The system uses SQLite for patient data storage and Redis for caching and real-time data management, ensuring fast and reliable performance.

- **Customizable Reports**: Users can generate and download customized reports in various formats (e.g., PDF, Excel) for further analysis and record-keeping.

- **Responsive Design**: The dashboard is designed to be fully responsive, ensuring seamless access and usability across different devices, including desktops, tablets, and smartphones.
## Deployment with Docker

This project can be easily deployed using Docker, which allows you to run the application in a consistent environment across different systems. Follow the steps below to get your application up and running in a Docker container.

**Step 1: Clone the Repository**

```bash
  git clone https://github.com/MatinGhanbari/PulseCare.git
  cd PulseCare
```

**Step 2: Run the Docker Containers**

```bash
  docker compose up --build -d
```

**Step 3: Access the Application**

Once the container is running, you can access the application by navigating to http://localhost:8000 in your web browser.



    
## Run Locally

Clone the project

```bash
  git clone https://github.com/MatinGhanbari/PulseCare.git
```

Go to the project directory

```bash
  cd PulseCare
```

Install dependencies using `pip`

```bash
  pip install --upgrade pip
  pip install --user -r requirements.txt
```

Go to the backend directory

```bash
  cd .\src\backend
```

Start the server

```bash
  python manage.py migrate
  python manage.py runserver 0.0.0.0:8000
```


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`REDIS_HOST`

`REDIS_PORT`

`REDIS_DB`


## Running Tests

To run tests:

Go to the backend directory
```bash
  cd .\src\backend
```

run the following command:

```bash
  python manage.py test
```


## Mobile Screenshots

Dashboard | Side Menu | Patient Table | Patient Pulse | Patients
--- | --- | --- | --- | ---
![image](https://github.com/MatinGhanbari/PulseCare/raw/refs/heads/main/assets/images/screenshots/mobile/dashboard.png) | ![image](https://github.com/MatinGhanbari/PulseCare/raw/refs/heads/main/assets/images/screenshots/mobile/aside-menu.png) | ![image](https://github.com/MatinGhanbari/PulseCare/raw/refs/heads/main/assets/images/screenshots/mobile/patient-table.png) | ![image](https://github.com/MatinGhanbari/PulseCare/raw/refs/heads/main/assets/images/screenshots/mobile/patient-pulse.png) | ![image](https://github.com/MatinGhanbari/PulseCare/raw/refs/heads/main/assets/images/screenshots/mobile/patients.png)

## Desktop Screenshots

Page | ScreenShots
--- | ---
Dashboard | ![image](https://github.com/MatinGhanbari/PulseCare/raw/refs/heads/main/assets/images/screenshots/desktop/dashboard.png)
Patient Table | ![image](https://github.com/MatinGhanbari/PulseCare/raw/refs/heads/main/assets/images/screenshots/desktop/patient-table.png)
Patient Pulse | ![image](https://github.com/MatinGhanbari/PulseCare/raw/refs/heads/main/assets/images/screenshots/desktop/patient-pulse.png)


## Acknowledgements

 - [Electrocardiography](https://en.wikipedia.org/w/index.php?title=Electrocardiography&oldid=1271573909)
 - [PhysioNet Databases](https://physionet.org/about/database/l)
 - [WFDB](https://archive.physionet.org/physiotools/wfdb.shtml)
 - [Chart js](https://www.chartjs.org/docs/latest/)
 

## Contributing

Contributions are always welcome!

See `contributing.md` for ways to get started.

Please adhere to this project's `code of conduct`.
