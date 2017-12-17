let i = 0
for (table of $(".nodeinfo")) {
  i++
  $table = $(table)
  let iota = new IOTA({
    provider: table.dataset.ip
  })

  iota.api.getNodeInfo(function(err, res) {

    var cont = "<p class='nodeinfo'>"
    console.log(res)
    cont += "<b>Sync: </b>" + res.latestSolidSubtangleMilestoneIndex + " / " + res.latestMilestoneIndex + "</br>"
    cont += "<b>Tips: </b>" + res.tips + "</br>"
    cont += "<b>CPU Cores: </b>" + res.jreAvailableProcessors + "</br>"
    cont += "<b>RAM Utilization: </b>" + humanFileSize(res.jreTotalMemory, true) + " / " + humanFileSize(res.jreMaxMemory, true) + "</br>"
    cont += '<canvas id="nodeinfo' + i + '" width="400" height="300"></canvas>'
    cont += "</p>"

    $table.html(cont)
    var ctx = $("#nodeinfo" + i)
    $.getJSON(table.dataset.ip.substring(0, table.dataset.ip.lastIndexOf(":")) + ":14222").done(function(data) {
      console.log(data)
      var myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.apply(null, Array(data.length)).map(function (_, i) {return 5 * (data.length - i);}),
          datasets: [{
            label: "CPU Utilization",
            data: data
          }]
        },
        options: {}
      })
    })
  })

  console.log(table.dataset.ip.substring(0, table.dataset.ip.lastIndexOf(":")) + ":14222")

}

function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
}
