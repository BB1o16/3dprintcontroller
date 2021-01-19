# 3dprintcontroller
The objective of this project is to create a network device capable of  being remotely accessed from anywhere that will allow the user to monitor and control various functions of a 3D printer. The user shall control print management to the 3D printer, while also being able to view the print process. The hardware used to accomplish the project is the Ender 3 3D printer, Raspberry Pi 4 Model B [1], and a Raspberry Pi Mini Camera Video Module. As seen in Figure 1, the Raspberry Pi will be directly connected to the 3D printer, while the Raspberry Pi Camera Module will be attached directly to the Raspberry Pi [1]. This project will also require a mount capable of facing the Camera Module towards the print, which can be 3D printed [1]. To accomplish this task, the Raspberry Pi will need to run a NodeJs web server which will use JavaScript for all server side development, as well as HTML and CSS for all client side development. Some light networking will also be needed, as the system will be accessed from outside of the local network. This can be accomplished via port forwarding from the router, and accessed through the network's external IP address. 
The reason why this project topic is important is because of the skills that will be learned throughout the project's development. It as well serves as a practical solution to a problem with 3D printers, as it can take hours for a 3D printer to print things. People do not always have the time to sit by all day and watch it print in person, but with this project, you would be able to initiate prints and monitor its progress while continuing with your day to day life.
