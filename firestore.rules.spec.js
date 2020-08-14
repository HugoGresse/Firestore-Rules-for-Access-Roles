/* eslint-env jest */
const firebase = require('@firebase/testing')
const path = require('path')
const fs = require('fs')

const projectId = 'firestore-access-rules-ruls'

const UID_ADMIN = 'ABOVEGOD'
const UID_MODERATOR = 'hugo'
const UID_PEON = 'peoniam'

const ACCOUNT_ADMIN = "admin"
const ACCOUNT_MODERATOR = "moderator"
const ACCOUNT_PEON = "peon"

function createApp(
    auth = {
        uid: UID_ADMIN,
        email_verified: true,
    }
) {
    return firebase.initializeTestApp({ projectId, auth }).firestore()
}

const createOrg = async (app, orgId) => {
    await app
        .collection('organizations')
        .doc(orgId)
        .set({
            organizationName: orgId,
            createdAt: Date.now()
        }, {merge: true})

    // ADMIN NEW
    await app
        .collection('organizations')
        .doc(orgId)
        .collection('peoples')
        .doc(UID_ADMIN)
        .set({
            uid: UID_ADMIN,
            accountType: ACCOUNT_ADMIN
        }, {merge: true})

    // New Establishment
    await  app
        .collection('organizations')
        .doc(orgId)
        .collection('establishments')
        .doc('EstablishmentOne')
        .set({
            name: "The Establishment"
        }, {merge: true})

    // ADMIN
    await  app
        .collection('organizations')
        .doc(orgId)
        .collection('peoples')
        .doc(UID_ADMIN)
        .collection('documents')
        .doc('docAdmin')
        .set({
            name: "Third document",
            owner: UID_ADMIN
        }, {merge: true})

    // MODERATOR
    await  app
        .collection('organizations')
        .doc(orgId)
        .collection('peoples')
        .doc(UID_MODERATOR)
        .set({
            uid: UID_MODERATOR,
            accountType: ACCOUNT_MODERATOR
        }, {merge: true})
    await  app
        .collection('organizations')
        .doc(orgId)
        .collection('peoples')
        .doc(UID_MODERATOR)
        .collection('documents')
        .doc('docModerator')
        .set({
            name: "First document",
            owner: UID_MODERATOR
        }, {merge: true})

    // PEON
    await  app
        .collection('organizations')
        .doc(orgId)
        .collection('peoples')
        .doc(UID_PEON)
        .set({
            uid: UID_PEON,
            accountType: ACCOUNT_PEON
        }, {merge: true})
    await  app
        .collection('organizations')
        .doc(orgId)
        .collection('peoples')
        .doc(UID_PEON)
        .collection('documents')
        .doc('docPeon')
        .set({
            name: "Second document",
            owner: UID_PEON
        }, {merge: true})
}

describe('Firestore rules', () => {
    beforeAll(async () => {
        const rulesPath = path.join(__dirname, 'firestore.rules')
        const rules = fs.readFileSync(rulesPath, 'utf8')
        await firebase.loadFirestoreRules({ projectId, rules })
    })

    afterAll(async () => {
        await Promise.all(firebase.apps().map(app => app.delete()))
    })

    beforeEach(async () => {
        await firebase.clearFirestoreData({ projectId })
    })

    describe('Admin rules', () => {
        it('Admin can read & write everything', async () => {
            const adminApp = createApp()

            // This will not work if admin was not write allowed
            await createOrg(adminApp, 'org1')

            // Read the org
            const getOrg = adminApp
                .collection('organizations')
                .doc('org1')
                .get()
            const resultOrg = await firebase.assertSucceeds(getOrg)
            const dataOrg = resultOrg.data()
            expect(dataOrg.organizationName).toEqual("org1")

            // READ Establishment
            const get = await adminApp
                .collection('organizations')
                .doc('org1')
                .collection('establishments')
                .doc('EstablishmentOne')
                .get()

            const result = await firebase.assertSucceeds(get)
            const data = result.data()
            expect(data.name).toEqual("The Establishment")

            // READ people docs

            // OWN
            const get2 = await adminApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_ADMIN)
                .collection('documents')
                .get()
            const result2 = await firebase.assertSucceeds(get2)
            expect(result2.docs.length).toEqual(1)

            // Moderator
            const get3 = await adminApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_MODERATOR)
                .collection('documents')
                .get()
            const result3 = await firebase.assertSucceeds(get3)
            expect(result3.docs.length).toEqual(1)

            // Peon
            const get4 = await adminApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_PEON)
                .collection('documents')
                .get()
            const result4 = await firebase.assertSucceeds(get4)
            expect(result4.docs.length).toEqual(1)
        })

        it('Admin is not allowed to read another organization', async () => {
            const adminApp = createApp()
            const UID_ADMIN_SECOND="UID_ADMIN_SECOND"
            const secondAdminApp = createApp({
                uid: "UID_ADMIN_SECOND",
                email_verified: true,
            })

            // first ADMIN NEW
            await createOrg(adminApp, 'org1')

            // secondOrgId ADMIN NEW
            const secondOrgId= "secondOrgId"
            await secondAdminApp
                .collection('organizations')
                .doc(secondOrgId)
                .set({
                    organizationName: secondOrgId,
                    createdAt: Date.now()
                }, {merge: true})
            await secondAdminApp
                .collection('organizations')
                .doc(secondOrgId)
                .collection('peoples')
                .doc(UID_ADMIN_SECOND)
                .set({
                    uid: UID_ADMIN_SECOND,
                    accountType: ACCOUNT_ADMIN
                }, {merge: true})


            const getOrg = adminApp
                .collection('organizations')
                .doc(secondOrgId)
                .get()
            await firebase.assertFails(getOrg)
        })
    })


    describe('Moderator rules', () => {
        it('Moderator can read the whole org', async () => {
            const adminApp = createApp()
            const moderatorApp = createApp({
                uid: UID_MODERATOR,
                email_verified: true,
            })

            await createOrg(adminApp, 'org1')

            // Read the org
            const getOrg = moderatorApp
                .collection('organizations')
                .doc('org1')
                .get()
            const resultOrg = await firebase.assertSucceeds(getOrg)
            const dataOrg = resultOrg.data()
            expect(dataOrg.organizationName).toEqual("org1")

            // READ Establishment
            const get = await moderatorApp
                .collection('organizations')
                .doc('org1')
                .collection('establishments')
                .doc('EstablishmentOne')
                .get()

            const result = await firebase.assertSucceeds(get)
            const data = result.data()
            expect(data.name).toEqual("The Establishment")

            // READ people docs

            // OWN
            const get2 = await moderatorApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_MODERATOR)
                .collection('documents')
                .get()
            const result2 = await firebase.assertSucceeds(get2)
            expect(result2.docs.length).toEqual(1)

            // Admin
            const get3 = await moderatorApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_ADMIN)
                .collection('documents')
                .get()
            const result3 = await firebase.assertSucceeds(get3)
            expect(result3.docs.length).toEqual(1)

            // Peon
            const get4 = await moderatorApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_PEON)
                .collection('documents')
                .get()
            const result4 = await firebase.assertSucceeds(get4)
            expect(result4.docs.length).toEqual(1)
        })

        it('Moderator can edit his own data', async () => {
            const adminApp = createApp()
            const moderatorApp = createApp({
                uid: UID_MODERATOR,
                email_verified: true,
            })

            await createOrg(adminApp, 'org1')

            // ADD data to his doc
            const write = await moderatorApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_MODERATOR)
                .collection('documents')
                .doc('newDocument')
                .set({
                    name: "My Test document",
                    owner: UID_MODERATOR
                }, { merge: true })

            await firebase.assertSucceeds(write)
        })

        it('Moderator is not allowed to edit other people doc or org/est docs', async () => {
            const adminApp = createApp()
            const moderatorApp = createApp({
                uid: UID_MODERATOR,
                email_verified: true,
            })

            await createOrg(adminApp, 'org1')

            // Write ADMIN doc
            const writeAdminDoc = moderatorApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_ADMIN)
                .collection('documents')
                .doc('editedByModerator')
                .set({
                    name: "Moderator is not allowed",
                    owner: UID_ADMIN
                }, { merge: true })
            await firebase.assertFails(writeAdminDoc)

            // Write PEON doc
            const writePeon = moderatorApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_PEON)
                .collection('documents')
                .doc('newDocument2')
                .set({
                    name: "My Last document",
                    owner: UID_PEON
                }, { merge: true })

            await firebase.assertFails(writePeon)

            // Write ORGANISATION
            const writeOrg = moderatorApp
                .collection('organizations')
                .doc('org1')
                .set({
                    organizationName: "Super org name"
                }, { merge: true })
            await firebase.assertFails(writeOrg)

            // Write ESTABLISHMENT
            const writeEst = moderatorApp
                .collection('organizations')
                .doc('org1')
                .collection('establishments')
                .doc('Another-esta')
                .set({
                    name: "This shouldn't work"
                }, { merge: true })
            await firebase.assertFails(writeEst)
        })

        it('Moderator can create a new org', async () => {
            const adminApp = createApp()
            const moderatorApp = createApp({
                uid: UID_MODERATOR,
                email_verified: true,
            })

            await createOrg(adminApp, 'org1')

            // Write ADMIN doc
            const newOrg = moderatorApp
                .collection('organizations')
                .doc("orgModerated")
                .set({
                    organizationName: "orgModerated",
                    createdAt: Date.now()
                }, { merge: true })

            await firebase.assertSucceeds(newOrg)
        })
    })


    describe('Peon rules', () => {

        it('Peon can only read his own doc', async () => {
            const adminApp = createApp()
            const peonApp = createApp({
                uid: UID_PEON,
                email_verified: true,
            })

            await createOrg(adminApp, 'org1')

            // READ Organization
            const getOrg = peonApp
                .collection('organizations')
                .doc('org1')
                .get()
            await firebase.assertFails(getOrg)

            // READ Establishment
            const getEst = peonApp
                .collection('organizations')
                .doc('org1')
                .collection('establishments')
                .doc('EstablishmentOne')
                .get()
            await firebase.assertFails(getEst)

            // READ people docs

            // OWN
            const getOwnDoc = await peonApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_PEON)
                .collection('documents')
                .get()
            const resultOwnDoc = await firebase.assertSucceeds(getOwnDoc)
            expect(resultOwnDoc.docs.length).toEqual(1)

            // Admin
            const getAdminDoc = peonApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_ADMIN)
                .collection('documents')
                .get()
            await firebase.assertFails(getAdminDoc)

            // Moderator
            const getModeratorDocs = peonApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_MODERATOR)
                .collection('documents')
                .get()
            await firebase.assertFails(getModeratorDocs)
        })

        it('Peon is not allowed to edit other people doc or org/est docs, only his own doc', async () => {
            const adminApp = createApp()
            const peonApp = createApp({
                uid: UID_PEON,
                email_verified: true,
            })

            await createOrg(adminApp, 'org1')

            // Write ADMIN doc
            const writeAdminDoc = peonApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_ADMIN)
                .collection('documents')
                .doc('editedByModerator')
                .set({
                    name: "Moderator is not allowed",
                    owner: UID_ADMIN
                }, { merge: true })
            await firebase.assertFails(writeAdminDoc)

            // Write PEON doc
            const writePeon = peonApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_PEON)
                .collection('documents')
                .doc('newDocument2')
                .set({
                    name: "My Last document",
                    owner: UID_PEON
                }, { merge: true })

            await firebase.assertSucceeds(writePeon)

            // Write MODERATOR doc
            const writeModerator = peonApp
                .collection('organizations')
                .doc('org1')
                .collection('peoples')
                .doc(UID_MODERATOR)
                .collection('documents')
                .doc('newDocument2')
                .set({
                    name: "My Last document",
                    owner: UID_PEON
                }, { merge: true })

            await firebase.assertFails(writeModerator)

            // Write ORGANISATION
            const writeOrg = peonApp
                .collection('organizations')
                .doc('org1')
                .set({
                    organizationName: "Super org name"
                }, { merge: true })
            await firebase.assertFails(writeOrg)

            // Write ESTABLISHMENT
            const writeEst = peonApp
                .collection('organizations')
                .doc('org1')
                .collection('establishments')
                .doc('Another-esta')
                .set({
                    name: "This shouldn't work"
                }, { merge: true })
            await firebase.assertFails(writeEst)
        })

    })
})
