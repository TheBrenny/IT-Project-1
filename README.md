# IT-Project-1
A repo containing the code and documentation (and project artefacts) for Group 7's IT Project.

## Development

To run this project to develop on it, run `npm run dev` in your console.

## Saving Mode

To save the sessions to a database, an environment variable `MYSQLURI` needs to be set with the URI to a MySQL database. On top of this, the `SAVE_SESSIONS` environment variable needs to be set to `TRUE`.

This will only save the first "POST" through the contact form, so we also need to set the `TESTING` environment variable to `TRUE`, in order to tell the server to reset the cookie.

There are other environment variables that effect the way sessions are saved, and then can be seen in the `config.js` file in the root of the app.

## Deployment

To deploy this project to your website, copy the `./app/public/captcha/` and `./app/public/assets/js/captcha/` folders to your project. The former contains the logic to determine whether the user is a bot or not, and the latter contains the code to submit the data to your server.

## Example

Check out an example of this project at https://it-project-1.herokuapp.com/