function submitData() {
  let name = document.getElementById("input-name").value;
  let email = document.getElementById("input-email").value;
  let phone = document.getElementById("input-phone").value;
  let subject = document.getElementById("input-subject").value;
  let massage = document.getElementById("input-message").value;

  if (name == "") {
    return alert("nama harus diisi");
  } else if (email == "") {
    return alert("email harus diisi");
  } else if (phone == "") {
    return alert("nomor harus diisi");
  } else if (subject == "") {
    return alert("pilih subject");
  } else if (massage == "") {
    return alert("massage harus diisi");
  }

  const emailRecever = "aditiakurniawanx@gmail.com";
  let a = document.createElement("a");
  a.href = `mailto:${emailRecever}?subject=${subject}&body=halo saya ${name} %0D%0A ${massage} %0D%0A hubungi saya via nomer : ${phone} atau %0D%0A via email : ${email}`;
  a.click();
}
