from selenium import webdriver
import time

for i in range(3):
    web_driver = webdriver.Chrome()
    web_driver.get('https://it-project-1-dev.herokuapp.com/?fbclid=IwAR3RyTws3aNDlg6CxrURbxr-V7aGRmooFWRqOHuZ7-moiPV5T7rxheLK_Lg')
    time.sleep(2)
    name = 'Bot'

    n = web_driver.find_element_by_xpath('/html/body/app/form/input[1]')
    n.send_keys(name)

    email = 'Bot@botmail.com'
    e = web_driver.find_element_by_xpath('/html/body/app/form/input[2]')
    e.send_keys(email)

    message = 'I am a bot'
    m = web_driver.find_element_by_xpath('/html/body/app/form/textarea')
    m.send_keys(message)

    submit_form = web_driver.find_element_by_xpath('/html/body/app/form/input[3]')
    submit_form.click()

    web_driver.close()
    web_driver.quit()

