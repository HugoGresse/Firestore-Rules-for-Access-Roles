# Firestore Rules for Access Roles

This is a sample/demo of Firestore rules with three (3) access level (admin/moderator/peon). It has been quickly tested to ensure a minimum security. 

#### Firestore model
- <ins>organizations</ins> (collection)
    - **organization1** (doc)
        - _organizationName_ (field)
        - _createdAt_ (field)
        - <ins>establishments</ins> (collection)
            - **establisment 1** (doc)
            - **establisment 2** (doc)
        - <ins>peoples</ins> (collection)  
            - **userId** (doc)  
                - _uid_: user id (field)  
                - _accountType_: "admin" || "moderator" || "peon" (field) 
                - <ins>documents</ins> (collection)
                    - **docId** (doc)  


#### Access level details: 

**Admin**
- read: the whole organization he is in (include establishments, peoples documents, organization)
- write: the whole organization he is in (include establishments, peoples documents, organization)

**Moderator**
- read: the whole organization he is in (include establishments, peoples documents, organization)
- write: only his own documents (`organizations/orgId/peoples/userId/documents/*`)

**Peon**
- read: only his own documents (`organizations/orgId/peoples/userId/documents/*`), not the organization or establishment
- write: only his own documents (`organizations/orgId/peoples/userId/documents/*`)


If you need more information: 
- [firestore.rules]()
- [firestore.rules.spec.js (tests)]()

_Originaly made for [this Stackoverflow question](https://stackoverflow.com/questions/63302743/firestore-security-access-roles-system)_


## Run unit test

Prerequisites: `firebase` CLI installed (`npm install -g firebase-tools`), NPM.
May be required: a Firebase project which will only be used for the Firebase setup, let me know if I can remove this line.

1. Clone this repo, install dependencies
2. Run the Firestore emulators: `npm run start`
3. Run the test: `npm run test`


# About
Open source demo/sample made by [Hugo Gresse](https://hugo.gresse.io)  
My other open source projects:
- [Open Feedback (speaker/conference/meetup event feedback SASS)](https://openfeedback.io/)
- [ICAL2API (.ical aggregation with admin, slack reminders, public page)](https://github.com/HugoGresse/Ical2Api)
- [Fill My Slides (Google Slide as template for generating thumbnail using .json data)](https://github.com/HugoGresse/Fill-My-Slides)
